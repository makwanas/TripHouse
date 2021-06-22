const router = require('express').Router()

const {getDownloadStreamByFilename, getPhotoById} = require('../../models/photo')

router.get('/:id--:size.jpg', async (req, res, next) => {

    console.log('Params ==> ', req.params)

    let filename = ''
    if (req.params.size === 'orig') {
        const photo = await getPhotoById(req.params.id)
        filename = photo.filename
        console.log('Id ==> ', req.params.id)
    } else {
        filename = `${req.params.id}--${req.params.size}.jpg`
    }


    // console.log('Photo ==> ',photo)
    getDownloadStreamByFilename(filename)
        .on('err', (err) => {
            if (err.code === 'ENOENT') {
                next()
            } else {
                next(err)
            }
        })
        .on('file', (file) => {
            res.status(200).type(file.metadata.contentType)
        })
        .pipe(res)
})

module.exports = router