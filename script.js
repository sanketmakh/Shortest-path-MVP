let map;
let markers = {};
let locations = [];
let renderLocations = [];
let directionsRenderer;

function handleEmailLogic() {
  if (localStorage.getItem("email") == null) {
    let modal = document.getElementById("myModal");
    modal.style.display = "block";
  } else {
    fetch(
      `http://localhost:3000/locations?email=${localStorage.getItem("email")}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) => {
        const ol = document.getElementById("ordered-list");
        for (let i = 0; i < res["locations"].length; i++) {
          let loc = res["locations"][i].location;
          let lat = res["locations"][i].lat;
          let lng = res["locations"][i].lng;
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: loc,
          });
          locations.push(loc);
          markers[loc] = marker;
          renderLocations.push(marker);
          map.setCenter(marker.getPosition());
          const li = document.createElement("li");
          li.innerHTML =
            loc +
            "&nbsp" +
            `<button style="height:20px; margin: 3px; color:blue;text-align:center;" onclick='markVisited(${loc})'>Done</button>`;
          li.id = loc;
          ol.append(li);
        }
      });
  }
}

function handleSubmit() {
  const email = document.getElementById("emailInput").value;
  if (email) {
    localStorage.setItem("email", email);
    let modal = document.getElementById("myModal");
    modal.style.display = "none";
  }
}

function initMap() {
  const directionsPanel = document.getElementById("directionsPanel");
  directionsPanel.innerHTML = ""; // Clear previous directions
  const ol = document.createElement("ol");
  ol.id = "ordered-list";
  directionsPanel.appendChild(ol);
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 18.554468235383755, lng: 73.90461134788202 },
    zoom: 15,
    mapId: "82c0b75c74b3caa2", // Optional for custom styling
  });
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true, // Hide default markers
    polylineOptions: {
      strokeColor: "#9B4444",
      strokeWeight: 4,
    },
  });
  directionsRenderer.setMap(map);
}

function markVisited(location) {
  console.log("--->", location);
  location = location.id;

  fetch("http://localhost:3000/deleteLocation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: localStorage.getItem("email"),
      location: location,
    }),
  });
  let marker = markers[location];
  // let icon = new google.maps.Icon({ url: "./tick.png" });
  marker.setIcon({
    url: "./tick.png",
    scaledSize: { width: 30, height: 30 },
  });
  console.log(renderLocations);

  const listItem = document.getElementById(location);
  listItem.innerHTML = "<s>" + location + "</s>";
  if (renderLocations.length <= 2) {
    console.log("In here");
    renderLocations = [];
    calculateShortestPath();
    return;
  }

  let idxToRemove = -1;
  for (let i = 0; i < renderLocations.length; i++) {
    if (renderLocations[i] === markers[location]) {
      idxToRemove = i;
      break;
    }
  }
  renderLocations = [
    ...renderLocations.slice(0, idxToRemove),
    ...renderLocations.slice(idxToRemove + 1),
  ];
  calculateShortestPath();
}

function addMarker() {
  const locationInput = document.getElementById("locationInput");
  const location = locationInput.value;
  locations.push(location);

  const ol = document.getElementById("ordered-list");
  const li = document.createElement("li");
  li.innerHTML =
    location +
    "&nbsp" +
    `<button style="height:20px; margin: 3px; color:blue;text-align:center;" onclick='markVisited(${locationInput.value})'>Done</button>`;
  li.id = location;
  ol.append(li);

  if (!location) {
    alert("Please enter a valid location.");
    return;
  }

  fetch("http://localhost:3000/addLocation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: localStorage.getItem("email"),
      location: location,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      const { lat, lng } = res;
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: location,
      });
      markers[location] = marker;
      renderLocations.push(marker);
    //   markers.push(marker); // Add marker to the markers array

      locationInput.value = ""; // Clear the input field

      map.setCenter(marker.getPosition());
    });
}

function calculateShortestPath() {
  if (renderLocations.length < 2) {
    directionsRenderer.setDirections(null);
    alert("Please add at least two markers before finding the shortest path.");
    return;
  }

  // Create waypoints using marker locations
  const waypoints = [];
  for (let i = 0; i < renderLocations.length - 1; i++) {
    waypoints.push({
      location: renderLocations[i].getPosition(),
      stopover: true, // Stopover to visit each marker
    });
  }

  // Optimize travel mode based on your requirements (e.g., driving, walking, etc.)
  const travelMode = google.maps.TravelMode.DRIVING; // Example

  // Create a DirectionsRequest object
  const request = {
    origin: renderLocations[0].getPosition(),
    destination: renderLocations[renderLocations.length - 1].getPosition(),
    waypoints: waypoints,
    travelMode: travelMode,
  };

  // Calculate the shortest path using DirectionsService
  directionsService.route(request, (response, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(response);
    } else {
      alert("Error: Could not find the shortest path.");
    }
  });
}

window.onload = handleEmailLogic;
