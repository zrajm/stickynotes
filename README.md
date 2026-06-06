STICKYNOTES!
============
Simple, web based, collaborative stickynotes!

This app can be used as a simple scrum board or for other stickynote activities
(e.g. on retrospectives).

It's pretty much a simplified version of physical stickynote board, with the
added bonus that it allows for natural collaboration within a dispersed team.
All stickynotes are shared in realtime, between all users currently viewing the
same board.


Software Used
-------------
Stickynotes have pretty minimal requirements on the server side, the only thing
you'll need is some a of web server and Dash.

* Javascript, jQuery (and jQuery UI) – Almost all program logic resides on the
  client side, meaning that this software make extensive use of Javascript and
  jQuery (and to a lesser degree jQuery UI – which is only used to make the
  stickynotes draggable, and might be phased out at some point).
* Dash (Debian Almquist shell) – All serverside scripts are written in Dash to
  speed up execution. These scripts make extensive use of the shell builtin
  commands (the only external command used is `inotifywait` which is needed for
  `poll.cgi` to work).


Installing
==========
All you need is a web server configured to run CGI scripts, and with
permissions set so that it may write to the stickynotes data directory. On an
Ubuntu/Debian machine the following commands (or something quite similar)
should get you going.


Lighttpd
--------
Install Lighttpd and enable the CGI module:

    apt install lighttpd
    sudo lighty-enable-mod cgi

Thereafter, edit your Lighttpd config file `/etc/lighttpd/lighttpd.conf` and
add the following line:

    cgi.assign = (".cgi" => "")

This specifies that all files with the file name extension `.cgi`, should be
run using the interpreter specified on the `#!` shebang line of the file (if
you want to, you can specify interpreter as `/bin/dash`).

If you want the setting to affect the whole web server (and not a specific
virtual host) you should put it at the root level of the config (and not inside
a `$HTTP["host"] ... { ... }` section). I added the instruction after the
`server.modules` statement at the top of the file).

After that, reload the Lighttpd config with:

    sudo service lighttpd force-reload

Now you can continue with on to [Testing That It Works](#testing-that-it-works)
and [User Settings](#user-settings) below.


Apache
------
First install Apache and enable the CGI module:

    sudo apt-get install apache2
    sudo a2enmod cgid

Enable CGI and tell Apache where to find stickynotes adding/modifying the
following options in the Apache config (the config file itself can be found in
`/etc/apache2/sites-enabled/`):

    DocumentRoot /home/USER/stickynotes
    Options +ExecCGI
    AddHandler cgi-script .cgi

Then restart Apache using:

    sudo service apache2 restart


Testing That It Works
---------------------
You can test that everything works by running:

    curl 'http://localhost/stickynotes/api/get.cgi'

If everything works you should get an error from the stickynotes application
complaining of faulty request, like so:

    {"code":400,"message":": Missing board ID"}

If, however, you instead see the source code of the `get.cgi` script, you have
failed to enable CGI in your web server.


User Settings
-------------
Finally add yourself to the web server's file permission group (`www-data`) and
change the permissions of stickynotes data directory (`data/`) so that the web
server may write stuff there.

    sudo adduser $USER www-data
    newgrp www-data
    chgrp -R www-data data/
    chmod -R g+w data

What the `newgrp` command actually does is starting a new shell where the
permission you added in the previous command is available, can be replaced by
logging out and logging in again.

<!--[eof]-->
