# Imagen de la API para producción (docker-compose.produccion.yml).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY alembic.ini .
COPY migrations ./migrations
COPY app ./app

# Sin privilegios de administrador dentro del contenedor. El código es de root y solo de lectura
# para la app; los permisos se normalizan para no depender de los del equipo donde se construye.
RUN chmod -R a+rX,go-w /app && useradd --system --no-create-home nodo
USER nodo

EXPOSE 8000
# Un solo proceso: aplica las migraciones al arrancar y los límites de intentos viven en memoria.
# --proxy-headers: la IP del visitante llega de Caddy en X-Forwarded-For (el límite de intentos
# va por email + IP). Se acepta de cualquier origen porque el puerto 8000 solo es accesible
# desde la red interna de Docker, nunca desde fuera.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
