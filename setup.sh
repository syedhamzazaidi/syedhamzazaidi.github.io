#!/bin/bash
docker build -t jekyll-env -f Dockerfile .
docker run --name jekyll-env --mount type=bind,source=$(pwd),target=/src -p 4000:4000 -it jekyll-env