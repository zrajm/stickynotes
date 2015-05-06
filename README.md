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

First install Apache and enable the CGI module:

    sudo apt-get install apache2
    sudo a2enmod cgid

Enable CGI and tell Apache where to find stickynotes adding/modifying the
following options in the Apache config (the config file itself can be found in
`/etc/apache2/sites-enabled/`):

    DocumentRoot /home/USER/stickynotes
    Options +ExecCGI
    AddHandler cgi-script .cgi

Restart Apache, add yourself to the Apache's group (`www-data`) and change the
permissions of stickynotes data directory (`data/`) so that Apache may write
stuff there.

    sudo service apache2 restart
    sudo adduser $USER www-data
    newgrp www-data
    chgrp -R www-data data/
    chmod -R g+w data

[eof]
