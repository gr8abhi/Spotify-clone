console.log('Lets write JavaScript');

// Audio object for playing songs
let currentSong = new Audio();

// Global variables to store songs and current folder
let songs;
let currFolder;

// Function to convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

// Function to fetch songs from a specified folder
async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/`);
        let html = await response.text();

        // Create a temporary div to parse the response
        let div = document.createElement("div");
        div.innerHTML = html;

        // Extract song links ending with .mp3
        let anchors = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < anchors.length; index++) {
            const element = anchors[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1].replaceAll("%20", " ")));
            }
        }

        // Display the songs in the playlist
        let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
        songUL.innerHTML = "";
        songs.forEach(song => {
            songUL.innerHTML += `<li>
                                    <img class="invert" width="34" src="img/music.svg" alt="">
                                    <div class="info">
                                        <div>${song}</div>
                                        <div>Harry</div>
                                    </div>
                                    <div class="playnow">
                                        <span>Play Now</span>
                                        <img class="invert" src="img/play.svg" alt="">
                                    </div>
                                </li>`;
        });

        // Attach click event listener to each song in the playlist
        Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        });

        return songs;
    } catch (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
}

// Function to play a selected song
const playMusic = (track, pause = false) => {
    if (track) {
        currentSong.src = `/${currFolder}/` + track;
        if (!pause) {
            currentSong.play();
            play.src = "img/pause.svg";
        }
        document.querySelector(".songinfo").innerHTML = decodeURI(track);
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    }
};

// Function to display albums on the page

async function displayAlbums() {
    try {
        let response = await fetch(`/songs/`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        let html = await response.text();

        let div = document.createElement("div");
        div.innerHTML = html;

        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        for (let index = 0; index < anchors.length; index++) {
            const e = anchors[index];
            if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/songs/")[1].split("/")[0]; // Extract folder name correctly

                let infoResponse = await fetch(`/songs/${folder}/info.json`);
                if (!infoResponse.ok) {
                    throw new Error(`Failed to fetch info.json for folder ${folder}. Status: ${infoResponse.status}`);
                }
                let albumInfo = await infoResponse.json();

                cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                                                <div class="play">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                                                    </svg>
                                                </div>
                                                <img src="/songs/${folder}/cover.jpg" alt="">
                                                <h2>${albumInfo.title}</h2>
                                                <p>${albumInfo.description}</p>
                                            </div>`;
            }
        }

        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async () => {
                console.log("Fetching Songs");
                songs = await getSongs(`songs/${e.dataset.folder}`);
                playMusic(songs[0]);
            });
        });

    } catch (error) {
        console.error('Error displaying albums:', error);
    }
}


// Main function to initialize the application
async function main() {
    try {
        // Get the list of all the songs
        await getSongs("songs/ncs");

        // Play the first song initially
        playMusic(songs[0], true);

        // Display all the albums on the page
        await displayAlbums();

        // Attach event listener to play button
        document.getElementById("play").addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/play.svg";
            }
        });

        // Listen for timeupdate event on the audio player
        currentSong.addEventListener("timeupdate", () => {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        });

        // Add event listener to seekbar
        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = (currentSong.duration * percent) / 100;
        });

        // Add event listener to volume control
        document.querySelector(".range input").addEventListener("input", (e) => {
            currentSong.volume = e.target.value / 100;
        });

        // Add event listener to mute/unmute button
        document.querySelector(".volume img").addEventListener("click", () => {
            if (currentSong.volume > 0) {
                currentSong.volume = 0;
                document.querySelector(".volume img").src = "img/mute.svg";
                document.querySelector(".range input").value = 0;
            } else {
                currentSong.volume = 1;
                document.querySelector(".volume img").src = "img/volume.svg";
                document.querySelector(".range input").value = 100;
            }
        });

        // Add event listener to previous button
        document.getElementById("previous").addEventListener("click", () => {
            let currentIndex = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if (currentIndex > 0) {
                playMusic(songs[currentIndex - 1]);
            }
        });

        // Add event listener to next button
        document.getElementById("next").addEventListener("click", () => {
            let currentIndex = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if (currentIndex < songs.length - 1) {
                playMusic(songs[currentIndex + 1]);
            }
        });

        // Add event listener to hamburger menu
        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        // Add event listener to close button
        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

    } catch (error) {
        console.error('Error in main function:', error);
    }
}

// Initialize the application
main();
