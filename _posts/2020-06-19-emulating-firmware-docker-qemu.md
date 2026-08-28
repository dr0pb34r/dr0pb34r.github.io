---
layout: post
title: "emulating firmware with docker and qemu"
date: 2020-06-19 10:00:00 +1000
categories:
  - archive
eyebrow: "from the archive // methods"
description: "A deliberately basic starting point for emulating MIPS firmware in a Docker container without rolling out a full VM."
permalink: /methods/emulating-firmware-docker-qemu/
---

*Originally published on megwhite.com.au in 2020. Links and technical details are preserved as a snapshot; time may have chewed on them.*

![MIPS example](/assets/images/archive/mips_arch.PNG?raw=true)

This is a cool way to quickly emulate architectures other than the one you're running on without having to roll out a full VM! 

I've done a basic and awful job of automating it so you can see how the pieces work together. You'll probably need to tweak a bunch of stuff to use these tools more generally, but now you have a clear starting point from which to tinker.

## How to do the thing

[I've made three scripts](https://github.com/unmeg/docker-emu): one to prepare your environment, one to build the Dockerfile and container image, and one to run the container (I've only included two run commands but obviously you could store whatever you wanted in there).

I've presented them this way so it's easy to follow. I don't think the run script is required.

Here is a usage example with the WNAP320 firmware:

```shell
git clone https://github.com/unmeg/docker-emu.git
cd docker-emu/
wget http://www.downloads.netgear.com/files/GDC/WNAP320/WNAP320_V3.7.11.4.zip
mv WNAP320* firmware.zip
chmod +x prep_docker.sh run_docker.sh build_docker.sh test_docker.sh

./prep_docker.sh

./build_docker.sh

./run_docker.sh
```
These commands will eventually drop you into a shell with access to the extracted firmware rootfs. 

I used this the other day to test a bindshell I'd compiled for a router I'm working on. It was super quick and easy because I just put the compiled binary in the /addons folder and built the container. Seconds later I was running the shell and testing its functionality.

## TODO
I haven't gotten gdbserver and remote debugging to work with this setup yet, which would sort of boost the whole thing from Very Cool to Totally Awesome. 

As of writing, I successfully get the binary (by putting it in addons) and can run it, but I get packet errors when I connect with GDB from my host. I'm not sure where the problem is and I haven't really spent any time on it. 

My plan was to figure it out before posting this up, but I'm getting more and more distracted from that task every day, so it may be a while.

If you get it working, let me know how and I'll update the scripts/post with credit to you!

## Credit where it's due
Speaking of credit..

I stole this idea wholesale from a great [AirGap2020 talk on emulating firmware with Docker](https://www.youtube.com/watch?v=N0EYsO0VxZo). You should watch the video and give thanks to Ilya.

## NB
* I'd never touched Docker before this side-quest so it's possible I've done this in a sub-optimal way. Feel free to let me know if you see anything daft.

* Similarly, I compiled these scripts like a week after I got this all working, and I was neither careful nor considerate when I threw in package downloads and repo clones. It's possible I've grabbed too much stuff for your setup! I was just trying to account for all possible comers. Carve out whatever you don't want.

* These scripts are for MIPS so firmware for other architectures won't work. At some point I will do some other versions too, but the idea was just to demonstrate how this works.
