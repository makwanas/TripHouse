# TripHouse

AirBnb + Yelp-like Backend clone

# Technologies and Framework used

- NodeJS and Express - Server implementation
- MongoDB and MongoGridFS - Database for storing relevant textual, image and file information
- Redis - Caching API requests for preventing DOS attacks
- RabbitMQ and JIMP - Processing offline image resizing

# High-level overview of the components

## 1. Server

The server is implemented with the help of Express and NodeJS. It contains more than 20 RESTful API end-points for specific business needs. More information about this could be found by running the postman collection found in the tests folder in the repository. Alternatively, you could also use the YAML file in the public folder and copy and paste the content here: https://editor.swagger.io/. Below are some of the screenshots for the routes and more information regarding them:

<img src = "![API_design_1](https://user-images.githubusercontent.com/56104768/132149438-a7024f1c-2577-451a-8686-da95111180fb.JPG)">
<img src = "![API_design_2](https://user-images.githubusercontent.com/56104768/132149547-003807de-98cd-450d-8290-5cdb8f5a36f1.JPG)">
<img src = "![API_design_3](https://user-images.githubusercontent.com/56104768/132149617-d5e70100-2fda-432c-b6ac-37220c262f02.JPG)">
<img src = "![individual_route_1](https://user-images.githubusercontent.com/56104768/132149672-e5c58b65-6cd2-4355-9849-3457b34d5fc3.JPG)">
<img src = "![individual_route_2](https://user-images.githubusercontent.com/56104768/132149686-3c2f8c63-3cf3-4b39-b708-7c54f835f80d.JPG)">

## 2. Database

The database has been implemented using MongoDB and MongoGridFS is used for storing file and image data. Redis database is used for caching API requests to prevent DOS attacks on the application.

<img src = "![rabbitmq_2](https://user-images.githubusercontent.com/56104768/132149740-4bfd36e7-df71-40e4-ae0d-2f179a0de7c7.JPG)">
<img src = "![API_rate_limiting](https://user-images.githubusercontent.com/56104768/132149754-7be4a96d-141e-476c-a21f-9b643e879075.JPG)">

## 3. Message broker

A RabbitMQ message broker is implemented for processing offline image resizing with the help of JIMP module. This makes the application much more robust and efficient for handling heavy jobs without causing much load on the server.

<img src = "![rabbitmq_1](https://user-images.githubusercontent.com/56104768/132149778-94219647-9b81-4432-b1aa-fb9790dc9a57.JPG)">

# How to run the application

There are 2 approaches to run the application. The first one involves using docker compose and the second one would be to spin off each of the containers individually using multiple docker runs.

(You would also need an environment file(.env) along with this in the main folder.)

```
#
# Docker Compose uses this file by default to look for specified environment
# variable names.  You would not normally include this file in source control!
#

MONGO_DATABASE=lodgings
MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=hunter2
MONGO_USER=lodgings
MONGO_PASSWORD=hunter2

```

## 1. Run application with Docker Compose

This approach sets up everything you need for this application and is ideal for production mode.

```
docker compose up --build
```

## 2. Docker runs

This approach individually setups each container required for the application. It is more useful for debugging purposes.

### Redis Server

An in-memory database which caches API requests to keep track of the number of requests for each user to prevent DOS attacks.

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
-e "MONGO_INITDB_DATABASE=lodgings" \
-e "MONGO_INITDB_ROOT_USERNAME=root" \
-e "MONGO_INITDB_ROOT_PASSWORD=hunter2" \
-e "MONGO_USER=lodgings" \
-e "MONGO_PASSWORD=hunter2" \
mongo:latest
```

### RabbitMQ

A message broker server plays a role as a channel between producers and consumers for performing offline image resizing.

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
node worker.js
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

# How to test the endpoints and application?

Checkout the postman collection in the tests folder in the repository. Importing that collection in Postman should be enough to test the application once everything is working fine! :)
