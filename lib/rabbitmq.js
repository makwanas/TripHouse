const amqp = require('amqplib')

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost'
const rabbitmqUrl = `amqp://${rabbitmqHost}`
console.log('RabbitMQ url ==> ', rabbitmqUrl)

let connection = null
let channel = null

exports.connectToRabbitMQ = async (queue) => {
    connection = await amqp.connect(rabbitmqUrl)
    channel = await connection.createChannel()
    await channel.assertQueue(queue)
}

exports.getChannel = function () {
    return channel
}