# Private Server Hub - UI

PSH is a private cloud solution for home setups. This is not designed to run in a production environement, but serves as a convenient way to host your applications on your home server using Docker, and optionally expose those using NGinx as a reverse proxy.
PSH is designed to deploy micro service architecture type of applications using Docker, build on top of `docker-compose` as the container configuration and ortchestration engine.

This repository is the frontend part of the PSH Server project. For more information about what Private Server Hub is, please refer to the project [psh-server](https://github.com/mdundek/psh-server).

## Build frontend

```
npm run-script build
```