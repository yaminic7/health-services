FROM node:12-alpine

# Install OpenJDK-8
RUN apk add openjdk8-jre

# Setup JAVA_HOME -- useful for docker commandline
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/
RUN export JAVA_HOME

ENV NODE_ENV=production

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

EXPOSE 4000

CMD [ "node", "IHSI.js" ]