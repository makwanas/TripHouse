# API hub

The goal of this project is to build a simple API for a Yelp-like application.
This project is developed in Windows OS. For macOS users, you may need to find another way to declare environment variables in another way.

Two approaches to run this application. One is using Docker runs; another one is using Docker Compose.

## 1. Docker runs

This approach needs to set up servers and databases individually. Although it might be cumbersome to create each instance of server and databases one at a time, this is the easy way that I've found to debug my application.
(You could also use Docker volume with docker-compose in development)

### Redis Server
An in-memory database to keep tracking of the number of requests for each user and thus to provide rate limit.
```
docker run -d --name redis-server \ 
-p 6379:6379 \ 
redis:latest
```


### MongoDB
A NoSQL database to stores most of the data.
```
docker run -d --name mongo-server \
--network mongo-net \
-v /$PWD/db-init:/docker-entrypoint-initdb.d \
-p "27017:27017" \
-e "MONGO_INITDB_DATABASE=businesses" \
-e "MONGO_INITDB_ROOT_USERNAME=root" \
-e "MONGO_INITDB_ROOT_PASSWORD=hunter2" \
-e "MONGO_USER=businesses" \
-e "MONGO_PASSWORD=hunter2" \
mongo:latest
```

### RabbitMQ
A server plays a role as a channel between producers and consumers.
```
docker run -d --name rabbitmq-server \
-p "5672:5672" \
-p "15672:15672" \
rabbitmq:3-management
```

### Server (Producer)
A server provides various middlewares to deal with different endpoint requests.
```
npm run dev
```

### Worker (Consumer)
Consuming jobs that are coming from producers. In this application, workers' main task is resizing photos in offline.
```
node woker.js
```

### MongoDB shell
A mongo CLI comes in handy in debugging.
```
winpty docker run --name mongo-shell --rm -it \
--network mongo-net \
mongo:latest \
mongo --host mongo-server \
--username root \
--password hunter2 \
--authenticationDatabase admin
```
## 2. Run application with Docker Compose
This approach sets up everything you need for this application.

```
docker compose up --build
```

## 3. Testing with Postman
To test each endpoint, I've already set up a file for testing in /tests folder. To use it, you can simply use import in Postman.