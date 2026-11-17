require 'json'
require 'time'
require 'uri'
require 'jekyll'

def check(condition, message)
  raise message unless condition
end

root = File.expand_path('..', __dir__)
courses = JSON.parse(File.read(File.join(root, '_data/courses.json')))
newsletter = JSON.parse(File.read(File.join(root, '_data/workshops.json')))
%w[newsletter_form_url newsletter_embed_url].each do |key|
  value = newsletter.fetch(key)
  check(value.empty? || URI.parse(value).is_a?(URI::HTTPS), "#{key} must use HTTPS")
end
check(newsletter['newsletter_embed_url'].empty? == newsletter['newsletter_form_uid'].empty?, 'Embed URL and UID must be configured together')
check(!File.read(File.join(root, 'mail.html')).include?('sibforms.com'), 'Unknown legacy mailing account must stay disconnected')
check(courses.map { |c| c['id'] }.uniq.length == 4, 'Expected four distinct offerings')
courses.each do |course|
  session = course.fetch('session')
  check(%w[workshop course].include?(course['type']), 'Each offering needs a workshop or course type')
  check(%w[upcoming announced open sold_out].include?(session['status']), "Invalid status: #{course['id']}")
  check(%w[tickets registration].include?(session['booking_type']), 'Invalid booking type')
  %w[path title summary introduction audience format experience bring].each do |key|
    check(!course.fetch(key).empty?, "Missing #{key}: #{course['id']}")
  end
  check(course['outcomes'].length >= 3 && course['outline'].length >= 3, 'Course detail is missing')
  %w[waitlist_form_url waitlist_embed_url].each do |key|
    check(course[key].empty? || URI.parse(course[key]).is_a?(URI::HTTPS), "#{key} must use HTTPS")
  end
  check(course['waitlist_embed_url'].empty? == course['waitlist_form_uid'].empty?, 'Waitlist embed URL and UID must be configured together')
  unless session['status'] == 'upcoming'
    %w[starts_at ends_at location price].each { |key| check(!session.fetch(key).empty?, "Missing session #{key}") }
    check(session['starts_at'].end_with?('+10:00') && session['ends_at'].end_with?('+10:00'), 'Use Brisbane +10:00 dates')
    check(Time.iso8601(session['ends_at']) > Time.iso8601(session['starts_at']), 'Session must end after it starts')
  end
  if session['status'] == 'open'
    check(URI.parse(session['booking_url']).is_a?(URI::HTTPS), 'Open sessions require an HTTPS booking URL')
  end
end

site = Jekyll::Site.new(Jekyll.configuration('source' => root, 'destination' => '/tmp/dropbear-check-unused', 'quiet' => true))
site.read
template = File.read(File.join(root, '_includes/course-session.html'))
render = lambda do |status, type = 'tickets', ending = '2099-12-01T17:00:00+10:00', form_url = ''|
  course = Marshal.load(Marshal.dump(courses.first))
  course['waitlist_form_url'] = form_url
  course['waitlist_embed_url'] = ''
  course['waitlist_form_uid'] = ''
  course['session'].merge!('status' => status, 'starts_at' => '2099-12-01T14:00:00+10:00',
    'ends_at' => ending, 'location' => 'Test venue', 'price' => 'A$100',
    'booking_url' => 'https://example.org/booking', 'booking_type' => type)
  site.liquid_renderer.file('test-session').parse(template).render!(
    {'include' => {'course' => course}, 'site' => site.site_payload['site']},
    registers: {site: site}, strict_variables: false)
end

open_session = render.call('open')
check(open_session.include?('data-booking-link') && open_session.include?('book tickets'), 'Open event must offer tickets')
check(open_session.include?('aest (brisbane)'), 'Time zone must be visible')
check(render.call('open', 'tickets', '2100-01-26T17:00:00+10:00').include?('26 january 2100'), 'Multi-week courses must show their full end date')
check(render.call('open', 'registration').include?('register for this session'), 'Free registration label missing')
%w[upcoming announced sold_out].each do |status|
  check(!render.call(status).include?('data-booking-link'), "#{status} must not offer checkout")
end
check(render.call('upcoming').include?('join the waitlist for the next workshop'), 'Undated course must remain promotable')
check(render.call('sold_out').include?('all sessions filled'), 'Sold-out copy missing')
check(!render.call('open', 'tickets', '2020-01-01T17:00:00+10:00').include?('data-booking-link'), 'Expired session must not offer checkout')
check(open_session.include?('join the waitlist by email') && open_session.include?('subject=waitlist:'), 'Manual waitlist must be explicit')
check(render.call('upcoming', 'tickets', '2099-12-01T17:00:00+10:00', 'https://example.org/waitlist').include?('href="https://example.org/waitlist"'), 'Configured hosted waitlist must be used')
puts 'Workshop configuration and booking/waitlist states passed.'
