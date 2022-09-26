# DockerfileFROM tiangolo/uvicorn-gunicorn-fastapi:python3.7

FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8-slim
#AS compile

#install dependencies
COPY ./requirements.txt /app/requirements.txt
RUN apt-get update && \
    apt-get install -y \
        build-essential \
        make \
        gcc \
    && pip install -r /app/requirements.txt --use-deprecated=legacy-resolver --no-cache-dir \
&& apt-get remove -y --purge make gcc build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 8000

COPY . /app/

WORKDIR /app/

CMD ["uvicorn", "fast_api:app","--host", "0.0.0.0", "--port", "8000"]
