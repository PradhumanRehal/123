

// creating map
var initMap = function(){
		return new google.maps.Map(document.getElementById('map'),{
		center: {lat: 28.613939,lng: 77.209021},
		zoom: 11
	});
};

var ViewModel = function(){

	// for handling the active marker
	var activeMarker;

	var self = this;

	// for search query
	self.query = ko.observable('');

	self.map = initMap();

	// marker constructor
	self.createMarker = function(location){
		var marker = new google.maps.Marker({
			map: self.map,
			position: location.location,
			title: location.title,
			animation: google.maps.Animation.DROP,
		});

		// click functionality for marker
		marker.addListener('click',function(){
			self.resetMarker(marker);
		}); 
		
		return marker;
	};

	self.markers = ko.observableArray();

	//pushing all the new markers to observable array
	locations.forEach(function(location){
		self.markers.push(new self.createMarker(location));
	});

	// creating infowindow
	self.infowindow = new google.maps.InfoWindow();

	// function to handle wikipedia api requests
	self.getWikiData = function(){
		var wikiQuery;

		// Requsting info 
		for(var i=0; i<self.markers().length; i++){
			wikiQuery = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.markers()[i].title + '&srproperties=snippet&format=json&callback=wikiCallback';
			$.ajax({
				url: wikiQuery,
				dataType:'jsonp',
				async: false,
				/*jshint loopfunc:true */
				success: function(data) {
					for(var i=0; i<self.markers().length; i++){
						if(data[1][0] == self.markers()[i].title){
							self.markers()[i].wikiData=data[2][0];
						}
					}
				},
				error: function(){
					for(var i=0; i<self.markers().length;i++){
						self.markers()[i].wikiData = 'Unfortunately an error has encountered';
					}
				}
			});	
		}
	};
	self.getWikiData();

	// Animation and Icon handling
	self.resetMarker=function(marker){

		//if activeMarker != marker set animation and icon to default
		if(activeMarker){
			activeMarker.setAnimation(false);
			activeMarker.setIcon('https://mt.googleapis.com/vt/icon/name=icons/spotlight/spotlight-poi.png');	
		}

		//if activeMarker == marker set animation and icon
		marker.setAnimation(google.maps.Animation.BOUNCE);
		marker.setIcon('https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-blue.png&psize=16&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1');
		// get infowindow for selected marker
		self.populateInfoWindow(marker);
		self.infowindow.open(map,marker);

		//set active marker
		activeMarker = marker;
	};

	// creating infowindow
	self.populateInfoWindow = function(marker) {
		var content='loading';
		if(marker.wikiData != undefined){
			content = '<h2>'+marker.title+'</h2>'+'<p>'+marker.wikiData+'</p>';
		}
		if(self.infowindow.marker != marker){
			self.infowindow.marker = marker;
			self.infowindow.setContent(content);
			self.infowindow.addListener('closeclick',function(){
            self.infowindow.marker = null;
            marker.setAnimation(false);
          });
		}
	};

	// filter functionality
	self.search = ko.computed(function() {
		return ko.utils.arrayFilter(self.markers(),function(marker){
			if (marker.title.toLowerCase().indexOf(self.query().toLowerCase())>=0) {
				marker.setVisible(true);
				return true;
			}
			else{
				marker.setVisible(false);
				self.infowindow.close();
			}
		});
	});
};

ko.applyBindings(new ViewModel());