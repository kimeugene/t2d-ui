FROM ubuntu:latest

COPY . /var/www/t2d-ui

WORKDIR /var/www/t2d-ui

RUN apt-get update && apt-get install curl -y && curl -sL https://deb.nodesource.com/setup_8.x | bash - && apt-get install nodejs -y

#RUN npm install --save-dev babel-loader babel-core babel-preset-es2015 babel-preset-react react react-dom flux
RUN npm install
RUN npm install webpack -g

CMD webpack --watch --watch-poll
