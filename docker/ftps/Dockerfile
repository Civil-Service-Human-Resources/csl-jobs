FROM delfer/alpine-ftp-server:latest
RUN apk add openssl

WORKDIR /home/testuser

COPY ./gen-cert.sh .

RUN chmod +x ./gen-cert.sh
RUN ./gen-cert.sh

ENV USERS=testuser|password123|/home/testuser
ENV ADDRESS=localhost
ENV TLS_CERT=/etc/ssl/private/cert.pem
ENV TLS_KEY=/etc/ssl/private/key.pem

USER testuser