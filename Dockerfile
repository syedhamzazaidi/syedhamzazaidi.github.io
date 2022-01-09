FROM ruby

WORKDIR /usr/src/blog

COPY . .

#port number the container should expose
#EXPOSE 5000

#run jekyll/blog