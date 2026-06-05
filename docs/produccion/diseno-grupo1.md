### c) docker-compose.prod.yml

#### Propósito
Orquestar los contenedores (Base de datos, API y Web) para el entorno productivo, garantizando que operen de forma segura, aislada y con límites de recursos para no comprometer el servidor host.

#### Estructura
El archivo definirá tres servicios principales (`db`, `api`, `web`), una red interna personalizada para la comunicación entre ellos, y volúmenes únicamente para la persistencia de datos (eliminando los volúmenes de código fuente usados en desarrollo).

#### Requisitos no funcionales
Resiliencia (reinicio automático y comprobación de estado de salud), seguridad estricta (sistemas de archivos de solo lectura y privilegios mínimos) y control de almacenamiento (rotación de logs).

#### Diseño de la configuración de servicios

| Aspecto | Requisito / Implementación |
| :--- | :--- |
| **Resource limits** | Se aplicarán bloques `deploy.resources` a cada servicio. Por ejemplo, la API tendrá un límite estricto de memoria (`mem_limit: 512m`) y CPU (`cpus: '0.5'`) para prevenir fugas de memoria (memory leaks) que afecten al host. |
| **Healthchecks** | **API:** Comprobación mediante `curl -f http://localhost:3000/health` (o endpoint equivalente).<br>**DB:** Comprobación nativa con `pg_isready -U admin -d alentapp_db`. Los servicios dependerán del estado "healthy" de la BD. |
| **Seguridad** | • `read_only: true`: Evita que un atacante modifique archivos o instale malware.<br>• `cap_drop: [ALL]`: Elimina permisos nativos del kernel de Linux.<br>• `cap_add: [NET_BIND_SERVICE]`: Único permiso otorgado para abrir puerto.<br>• `security_opt: [no-new-privileges:true]`: Evita el escalado de privilegios. |
| **Logging** | Se configurará el bloque `logging` con el driver `json-file` y opciones para limitar el tamaño y evitar que los logs saturen el disco duro del servidor: `max-size: "10m"` y `max-file: "3"`. |
| **Red** | Se creará una red interna explícita (ej. `alentapp-prod-net`). Los contenedores se comunicarán a través de esta red, evitando usar la red bridge por defecto de Docker, mejorando el aislamiento DNS. |
| **Secrets** | Se eliminarán las credenciales hardcodeadas (ej. contraseñas de BD). Los servicios consumirán estas credenciales de forma segura mediante la directiva `env_file: - .env` u ocultas en el entorno del servidor. |