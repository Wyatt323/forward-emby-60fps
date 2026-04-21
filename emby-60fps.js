(function () {
    'use strict';

    function parseFPS(fps) {
        if (!fps) return 0;

        if (typeof fps === "string" && fps.includes("/")) {
            let parts = fps.split("/");
            return parseFloat(parts[0]) / parseFloat(parts[1]);
        }

        return parseFloat(fps);
    }

    try {
        let body = $response.body;
        let data = JSON.parse(body);

        if (!data || !data.MediaSources) {
            $done({});
            return;
        }

        const originalSources = JSON.parse(JSON.stringify(data.MediaSources));

        function getFPS(source) {
            if (!source.MediaStreams) return 0;

            const video = source.MediaStreams.find(s => s.Type === "Video");
            if (!video) return 0;

            return parseFPS(video.RealFrameRate || video.AverageFrameRate);
        }

        let sources = data.MediaSources.map(source => {
            return {
                source,
                fps: getFPS(source),
                bitrate: source.Bitrate || 0
            };
        });

        let fps60 = sources.filter(s => s.fps >= 59);

        let finalSources;

        if (fps60.length > 0) {
            fps60.sort((a, b) => b.bitrate - a.bitrate);
            finalSources = fps60.map(s => s.source);
        } else {
            sources.sort((a, b) => b.bitrate - a.bitrate);
            finalSources = sources.map(s => s.source);
        }

        data.MediaSources = finalSources;

        $done({ body: JSON.stringify(data) });

    } catch (e) {
        $done({});
    }
})();
