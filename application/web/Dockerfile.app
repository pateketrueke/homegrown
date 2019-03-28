FROM pateketrueke/nodejs:latest

COPY ./package*.json /app/
WORKDIR /app
RUN npm ci

COPY . /app/
RUN make dist

EXPOSE 80
ENTRYPOINT ["node"]
CMD ["."]