#include <FastLED.h>


// LED strip configuration

#define LED_PIN 5

#define NUM_LEDS 130  // Update to number of LEDs in the strip


CRGB leds[NUM_LEDS];


void setup() {

 FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);

 // pinMode(LED_BUILTIN, OUTPUT);

}


void loop() {

 

 // Loop through the entire strip to create the chase effect

 for (int i = 0; i < NUM_LEDS+2; i++) {  // Add a little extra for wraparound effect


   // Reset all LEDs to off

   fill_solid(leds, NUM_LEDS, CRGB::Black);


   // Light up one LED with red and create the moving effect

   leds[i % NUM_LEDS] = CRGB::Red;


   // Update the LEDs

   FastLED.show();

   delay(30); // Adjust delay for chase speed

 }

}
