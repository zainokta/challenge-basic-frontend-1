FROM debian:trixie-slim

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY index.html style.css script.js assets *.html /var/www/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
