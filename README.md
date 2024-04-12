# DiPreLa
Diet Pregnancy Lactation

## Apache setup
```
sudo a2enmod proxy proxy_http ssl
```

## Build and Run

- Install [Deno](https://deno.land/manual/getting_started/installation)

Build frontend and serve

```
make
```

Specify port:

```
PORT=9000 make
```
Daemontools Startup
```
#!/bin/sh
exec 2>&1
cd /home/zdavatz/software/diprela/
PATH=/home/zdavatz/.deno/bin/:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
exec setuidgid zdavatz make
```
