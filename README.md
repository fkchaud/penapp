Esto se buildea usando:
```bash
npx expo export -p web
```
Luego se corre a través de nginx con el siguiente conf file:
```nginx
http {
    # ...
    server {
        # ...
        location / {
            alias /Users/facundochaud/projects/penapp/dist/;
            try_files $uri /index.html;
        }
```
