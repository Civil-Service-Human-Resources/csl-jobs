mkdir certs && cd certs || exit
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/C=UK/ST=State/L=London/O=CabinetOffice/CN=localhost"

chmod 600 certs/cert.pem
chmod 600 certs/key.pem