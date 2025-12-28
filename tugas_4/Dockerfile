FROM debian:trixie-slim

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY . /var/www/html/

RUN chmod -R 755 /var/www/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
