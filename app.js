import axios from 'axios';

import { getConjunctions } from './conjunctionAlert';

console.log("hello words")

getLocation();

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
            url: (`https://api.scraperapi.com?api_key=2f68c42eb2b414a2b03f7b862b466d34&url=http://api.positionstack.com/v1/reverse?access_key=3c0f357a575272c65473326b89991bc6&query=${latitude},${longitude}`),
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
        }, 2000);

        document.querySelector('#myLocation').innerHTML = resData.slice(1, -1);
        document.querySelector('#myLocalTime').innerHTML = new Date().toLocaleTimeString('en-US');

    }

}

var popUpModal = document.getElementById('popUpModal');

popUpModal.addEventListener('show.bs.modal', function(event) {
    // Button that triggered the modal
    var button = event.relatedTarget;
    var modalTitle = popUpModal.querySelector('.modal-title')
        // Update the modal's content.
    var modalBody = popUpModal.querySelector('.modal-body')

    if (button.id == "liveVideoToggle") {
        button = event.relatedTarget;
        modalTitle.textContent = "Live ISS Video";
        modalBody.innerHTML = "";
        modalBody.innerHTML = `<iframe width="470" height="315" src="https://www.youtube-nocookie.com/embed/Y1qQZbTF8iQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (button.id == "imageToggle") {
        modalTitle.textContent = "ISS Modules";
        modalBody.innerHTML = "";
        const resultBody = document.createElement('div');

        modalBody.innerHTML = `<select class="form-select" id="getModule">
        <option value="1">Zarya Module</option>
        <option value="2">Unity Module</option>
        <option value="3">Zvezda Service Module</option>
        <option value="4">Z1 (Zenith) Truss</option>
        <option value="5">U.S. Destiny Laboratory Module</option>
        <option value="6">External Stowage Platform-1</option>
        <option value="7">Space Station Robotic Manipulator System</option>
        <option value="8">Quest Airlock</option>
        <option value="9">Pirs Docking Compartment</option>
        <option value="10">S0 (Starboard) Truss</option>
        <option value="11">S1 (Starboard) Truss</option>
        <option value="12">External Stowage Platform-2</option>
        <option value="13">P3/P4 (Port) Truss & Solar Arrays</option>
        <option value="14">P5 (Port) Truss Spacer</option>
        <option value="15">S3/S4 (Starboard) Truss & Solar Arrays</option>
        <option value="16">S5 (Starboard) Truss Spacer</option>
        <option value="17">Harmony Module</option>
        <option value="18">Columbus Laboratory Module</option>
        <option value="19">Japanese Logistics Module and Dextre</option>
        <option value="20">Japanese Pressurized Module (Kibo)</option>
        <option value="21">S6 (Starboard) Truss Spacer and Solar Arrays</option>
        <option value="22">Japanese Exposed Facility</option>
        <option value="23">Poisk Mini-Research Module-2</option>
        <option value="24">EXPRESS Logistics Carrier-1</option>
        <option value="25">Tranquility Module and Cupola</option>
        <option value="26">Rassvet Mini-Research Module-1</option>
        <option value="27">Permanent Multipurpose Module</option>
        <option value="28">Alpha Magnetic Spectrometer-2 (AMS-2)</option>
        <option value="29">Bigelow Expandable Activity Module (BEAM)</option>
        <option value="30">NanoRacks Bishop Airlock</option>
        <option value="31">Nauka Multipurpose Laboratory Module</option>
        <option value="32">Prichal Docking Module</option>
      </select>`;

        const select = document.querySelector('#getModule')
        select.addEventListener('change', async(e) => {
            const reqModule = e.target.value;
            resultBody.innerHTML = "Loading...";

            const res = await axios({
                method: 'get',
                url: `https://iss-module.azurewebsites.net/${reqModule}`,
                headers: {}
            });

            const resModule = await res.data;

            resultBody.innerHTML = "";
            resultBody.innerHTML = `<div class="conjunctions-wrapper">
                    <div class="conjunction">
                    <div class="image-wrapper">
                       <img src="${resModule.images[0]}"></img>
                    </div>
                    <div>
                        <p>Module</p>
                        <span><a>Module Name: </a><a>${resModule.module}</a></span>
                        <span><a>Launch Date: </a><a>${resModule.launchDate}</a></span>
                        <span><a>Installed Date: </a><a>${resModule.installedDate}</a></span>
                        <span><a>Mass: </a><a>${resModule.mass}</a></span>
                    </div>
                    <div>
                        <p>Details</p>
                        <span><a>Nation: </a><a>${resModule.nation}</a></span>
                        <span><a>Type: </a><a>${resModule.type}</a></span>
                        <span><a>Operator: </a><a>${resModule.operator}</a></span>
                        <span><a>Contractors: </a><a>${resModule.contractors}</a></span>
                        <span><a>Equipment: </a><a>${resModule.equipment}</a></span>
                        <span><a>Configuration: </a><a>${resModule.configuration}</a></span>
                        <span><a>Propulsion: </a><a>${resModule.propulsion}</a></span>
                        <span><a>Power: </a><a>${resModule.power}</a></span>
                        <span><a>Lifetime: </a><a>${resModule.lifetime}</a></span>
                        <span><a>Orbit: </a><a>${resModule.orbit}</a></span>
                    </div>
                </div>
            </div>`;
        });

        modalBody.append(resultBody);
    } else if (button.id == "passesToggle") {
        modalTitle.textContent = "Pass Alerts";
        modalBody.innerHTML = "";
        modalBody.innerHTML = "Loading...";

        function geUserLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.watchPosition(showPosition);
            } else {
                x.innerHTML = "Geolocation is not supported by this browser.";
            }
        }

        async function showPosition(position) {

            function genDate(date) {
                var year = date.substring(0, 4);
                var month = date.substring(4, 6);
                var day = date.substring(6, 8);
                var hour = date.substring(8, 10);
                var min = date.substring(10, 12);
                var sec = date.substring(12, 14);

                var newDate = new Date(year, month - 1, day).toDateString();
                return `${newDate} ${hour}: ${min}: ${sec}`
            }

            function getDirection(angle) {
                var directions = ['S', 'SSE', 'SE', 'ESE', 'E', 'ENE', 'NE', 'NNE', 'N', 'NNW', 'NW', 'WNW', 'W', 'WSW', 'SW', 'SSW'];
                var index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 22.5) % 16;
                return directions[index];
            }

            const getPassesRes = await axios({
                method: 'get',
                url: `https://api.scraperapi.com?api_key=2f68c42eb2b414a2b03f7b862b466d34&url=https://www.astroviewer.net/iss/ws/predictor.php?sat=25544&lon=${position.coords.longitude}&lat=${position.coords.latitude}`,
                headers: {}
            })

            const getPasses = await JSON.parse(JSON.stringify(getPassesRes.data))["passes"];
            console.log(getPasses)

            modalBody.innerHTML = ""

            if (getPasses.length != 0) {
                getPasses.forEach(e => {
                    modalBody.innerHTML += `<div class="conjunctions-wrapper">
                        <div class="conjunction">
                        <div>
                            <p>Pass Time</p>
                            <span><a>Date: </a><a>${genDate(e.begin)}</a></span>
                            <span><a>Magnitude: </a><a>${e.mag}</a></span>
                            <span><a>Visible Radius: </a><a >${e.visibRad}</a></span>
                        </div>
                        <div>
                            <p>Sighting Details</p>
                            <span><a>Start: </a><a>${genDate(e.begin)}</a></span>
                            <span><a>Start Altitude: </a><a>${e.beginAlt}</a></span>
                            <span><a>Start Direction: </a><a>${getDirection(e.beginDir)}</a></span>
    
                            <span><a>Max: </a><a>${genDate(e.max)}</a></span>
                            <span><a>Max Altitude: </a><a>${e.maxAlt}</a></span>
                            <span><a>Max Direction: </a><a>${getDirection(e.maxDir)}</a></span>
    
                            <span><a>End: </a><a>${genDate(e.end)}</a></span>
                            <span><a>End Altitude: </a><a>${e.endAlt}</a></span>
                            <span><a>End Direction: </a><a>${getDirection(e.endDir)}</a></span>
    
                        </div>
                    </div>
                </div>`
                });
            } else {
                modalBody.innerHTML = "No passes above your location."
            }
        }

        geUserLocation();


    } else {
        modalTitle.textContent = "Conjunction Alert";
        modalBody.innerHTML = "";
        modalBody.innerHTML = "Loading...";

        async function getConjunction() {
            const resData = getConjunctions();
            const modal = document.querySelector('.modal-body');
            modal.innerHTML = ""

            for (let item = 0; item < resData.length; item++) {
                modal.innerHTML += `<div class="conjunctions-wrapper">
                <div class="conjunction">
                <div>
                    <p>Object Details</p>
                    <span><a>Object: </a><a id="conjunction_object">${resData[item].object.name}</a></span>
                    <span><a>NORAD ID: </a><a id="conjunction_objectId">${resData[item].object.noradId}</a></span>
                    <span><a>Days Since Epoch: </a><a id="conjunction_object_dse">${resData[item].object.daysSinceEpoch}</a></span>
                </div>
                <div>
                    <p>Conjunction Details</p>
                    <span><a>Start: </a><a id="conjunction_start">${resData[item].conjunction.start}</a></span>
                    <span><a>Probability: </a><a id="conjunction_probability">${resData[item].conjunction.probability}</a></span>
                    <span><a>Dilution Threshold: </a><a id="dlt">${resData[item].conjunction.dilutionThreshold} km</a></span>
                    <span><a>Minimum Range: </a><a id="conjunction_minRange">${resData[item].conjunction.minRange} km</a></span>
                    <span><a>Velocity: </a><a id="conjunction_velocity">${resData[item].conjunction.velocity} km/sec</a></span>
                    <span><a>TCA: </a><a id="conjunction_tca">${resData[item].conjunction.tca}</a></span>
                    <span><a>Stop: </a><a id="conjunction_stop">${resData[item].conjunction.stop}</a></span>
                </div>
            </div>
        </div>`;
            }
        }

        getConjunction();
    }
})