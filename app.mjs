import express from 'express';
import { spawn } from 'child_process';
const server = express();
import createCollage from 'fitzmode-photo-collage';
import fs from 'fs';

const youtube = (apikey, image, audio) => {
    let currentImage = image;
    let currentDest = "../streami/b.jpg"; // Initialize with b.jpg
    let mainFfmpeg, bufferFfmpeg;

    const startFfmpeg = (isBuffer = false) => {
        const ffmpegCommand = [
            'ffmpeg',
            '-re',
            '-loop', '1',
            '-i', currentImage,
            '-i', audio,
            '-vf', 'fps=30',
            '-vcodec', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-b:v', '4000k',
            '-maxrate', '4500k',
            '-bufsize', '8000k',
            '-preset', 'medium',
            '-r', '30',
            '-g', '60',
            '-crf', '20',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-ar', '44100',
            '-strict', 'experimental',
            '-video_track_timescale', '100',
            '-f', 'flv',
            `rtmp://a.rtmp.youtube.com/live2/${apikey}`,
        ];

        const ffmpegProcess = spawn(ffmpegCommand[0], ffmpegCommand.slice(1));

        ffmpegProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        ffmpegProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        ffmpegProcess.on('close', (code) => {
            console.log(`ffmpeg process exited with code ${code}`);
        });

        ffmpegProcess.on('error', (err) => {
            console.error(`ffmpeg process error: ${err}`);
        });

        if (isBuffer) {
            bufferFfmpeg = ffmpegProcess;
        } else {
            mainFfmpeg = ffmpegProcess;
        }
    };

    // Initial start for both main and buffer
    startFfmpeg();
    startFfmpeg(true);

    // Function to update the image and restart ffmpeg processes
    const updateImageAndRestart = () => {
        createCollage(options)
            .then((canvas) => {
                // Dynamically switch between a.jpg and b.jpg
                currentImage = (currentImage === 'a.jpg') ? 'b.jpg' : 'a.jpg';
                currentDest = (currentDest === "../streami/a.jpg") ? "../streami/b.jpg" : "../streami/a.jpg";

                const src = canvas.jpegStream();
                const dest = fs.createWriteStream(currentDest);
                console.log('done')
                src.pipe(dest);

                // Stop the existing main ffmpeg process
                if (mainFfmpeg) {
                    mainFfmpeg.kill('SIGINT');
                }

                // Start a new main ffmpeg process with updated image
                startFfmpeg();

                // Stop the existing buffer ffmpeg process
                if (bufferFfmpeg) {
                    bufferFfmpeg.kill('SIGINT');
                }

                // Start a new buffer ffmpeg process with updated image
                startFfmpeg(true);
            });
    };

    // Initial image update and ffmpeg start
    updateImageAndRestart();

    // Schedule image update and ffmpeg restart every 15 seconds
    setInterval(updateImageAndRestart, 15000);

    server.use('/', (req, res) => {
        res.send('Your Live Streaming Is All Ready Live');
    });

    server.listen(3000, () => {
        console.log('live stream is ready');
    });
};

const api = "STREAM_KEY_HERE"; //change with your streamkey
const audio = "https://usa9.fastcast4u.com/proxy/jamz?mp=/1"; //change with your mp3 link or audio file name, this one happens to be a 24/7 lofi internet radio station

const options = {
    sources: [
        'https://ns-webcams.its.sfu.ca/public/images/gaglardi-current.jpg',
        'https://ns-webcams.its.sfu.ca/public/images/udn-current.jpg',
        'https://ns-webcams.its.sfu.ca/public/images/towers-current.jpg',
        'https://ns-webcams.its.sfu.ca/public/images/towern-current.jpg',
    ],
    width: 2,
    height: 2,
    imageWidth: 959,
    imageHeight: 538.5,
    backgroundColor: "#000000",
    spacing: 2,
    textStyle: { height: 1 },
};

youtube(api, 'a.jpg', audio);
