mkdir certs && cd certs || exit
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/key.pem \
  -out /etc/ssl/private/cert.pem \
  -subj "/C=UK/ST=State/L=London/O=CabinetOffice/CN=localhost" || exit

chmod 600 /etc/ssl/private/cert.pem
chmod 600 /etc/ssl/private/key.pem