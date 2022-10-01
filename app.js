import axios from 'axios';

main();

async function getLocation() {

    window.addEventListener('load', (event) => {
        getCoordinates();
    });

    function getCoordinates() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            console.log("Geolocation is not supported by this browser.")
        }
    }

    async function showPosition(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

        document.querySelector('#myLatitude').innerHTML = latitude.toPrecision(7);
        document.querySelector('#myLongitude').innerHTML = longitude.toPrecision(7);

        let config = {
            method: 'get',
            url: (`http://api.positionstack.com/v1/reverse?access_key=3c0f357a575272c65473326b89991bc6&query=${latitude},${longitude}`),
            headers: {}
        };

        const res = await axios(config);
        const resData = await JSON.stringify(res.data.data[0].label);

        setInterval(async() => {
            const resISS = await axios({
                method: 'get',
                url: 'https://api.wheretheiss.at/v1/satellites/25544',
                headers: {}
            })

            const resISSData = await JSON.parse(JSON.stringify(resISS.data));
            const issObject = {
                "latitude": resISSData["latitude"].toPrecision(7),
                "longitude": resISSData["longitude"].toPrecision(7),
                "altitude": new Number(resISSData["altitude"].toPrecision(7)).toFixed(1),
                "velocity": new Number(resISSData["velocity"].toPrecision(10)).toFixed(1),
                "timeStamp": new Date(resISSData["timestamp"]).toLocaleTimeString("en-US"),
                "visibility": resISSData["visibility"]
            }

            var iss_velocity = issObject.velocity;
            var iss_altitude = issObject.altitude;
            var updatedSpeedVel = Math.round(iss_velocity * 180 / 10000) - 45;
            var updatedSpeedAlt = Math.round(iss_altitude * 180 / 100) - 45;

            $("#speedbox-score-issVelcoity").css("transform", "rotate(" + updatedSpeedVel + "deg)");
            document.getElementById("speedbox-issVelocity").innerHTML = iss_velocity;

            $("#speedbox-score-issAltitude").css("transform", "rotate(" + updatedSpeedAlt + "deg)");
            document.querySelector('#speedbox-issAltitude').innerHTML = iss_altitude;

            document.querySelector('#iss_latitude').innerHTML = issObject.latitude;
            document.querySelector('#iss_longitude').innerHTML = issObject.longitude;
            document.querySelector('#iss_velocity').innerHTML = issObject.velocity + ' km/h';
            document.querySelector('#iss_altitude').innerHTML = issObject.altitude + ' m';
            document.querySelector('#iss_timeStamp').innerHTML = issObject.timeStamp;
            document.querySelector('#iss_status').innerHTML = (issObject.visibility).charAt(0).toUpperCase() + (issObject.visibility).slice(1);
        }, 3000);

        document.querySelector('#myLocation').innerHTML = resData.slice(1, -1);
        document.querySelector('#myLocalTime').innerHTML = new Date().toLocaleTimeString('en-US');

    }
}

async function main() {
    await getLocation();
}