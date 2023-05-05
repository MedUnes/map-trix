var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { _loadGoogleMapsScript } from './utils/loader';
const defaultOptions = {
    language: 'fr',
    version: 'weekly',
};
/**
 *
 * @param {String} API_KEY
 * @param {Object} options
 * @returns {MapTrix} MapTrix instance
 */
export function createMapTrix(API_KEY = null, { language = 'en', version = 'weekly' } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof google == 'undefined') {
            const options = {
                language,
                version,
            };
            yield _loadGoogleMapsScript(API_KEY, options);
            return new MapTrix();
        }
        return new MapTrix();
    });
}
const defaultConfig = {
    enableBounds: false,
};
const defaultMapOptions = {
    center: { lat: 48.92340114684859, lng: 2.259291646326453 },
    zoom: 9,
    minZoom: 2,
    disableDefaultUI: false,
    //zoomControl: true,
    //zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL},
};
const defaultMarkerOptions = {};
export class MapTrix {
    constructor(API_KEY = null) {
        this.config = {};
        this.mapEl = null;
        this.map = null;
        this.mapOptions = {};
        this.markers = [];
        this.markerOptions = {};
        this.currentInfoWindow = null;
        this.bounds = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        if (typeof google == 'undefined')
            _loadGoogleMapsScript(API_KEY, defaultOptions);
    }
    init(mapElSelector = '#mapContainer', customMapOptions = {}, config = {}) {
        var _a, _b;
        if (this.map !== null)
            throw new Error('a map is already loaded for this instance!');
        this.config = Object.assign(Object.assign({}, defaultConfig), config);
        const latitude = ((_a = customMapOptions === null || customMapOptions === void 0 ? void 0 : customMapOptions.center) === null || _a === void 0 ? void 0 : _a.lat) || defaultMapOptions.center.lat;
        const longitude = ((_b = customMapOptions === null || customMapOptions === void 0 ? void 0 : customMapOptions.center) === null || _b === void 0 ? void 0 : _b.lng) || defaultMapOptions.center.lng;
        this.mapOptions = Object.assign(Object.assign(Object.assign({}, defaultMapOptions), { center: this.point(latitude, longitude) }), customMapOptions);
        const $mapElSelector = document.querySelector(mapElSelector);
        if ($mapElSelector) {
            this.mapEl = $mapElSelector;
            this.map = new google.maps.Map(this.mapEl, this.mapOptions);
            if (this.config.enableBounds) {
                this.bounds = google.maps ? new google.maps.LatLngBounds() : null;
            }
        }
        else {
            throw new Error('Map container element not found');
        }
    }
    /**
     * Set map options
     * @param {google.maps.MapOptions} options
     */
    setMapOptions(options) {
        try {
            if (options.latitude && options.langitude) {
                options.center = this.point(options.latitude, options.langitude);
            }
            this.map.setOptions(options);
        }
        catch (e) {
            console.log('Exception', e);
        }
    }
    point(latitude, longitude) {
        return new google.maps.LatLng(latitude, longitude);
    }
    // MARKERS ##############################################
    /**
     * Add marker
     * @param {Object} options : object{ title, content, latitude, longitude, draggable, icon ... }
     * @param {Boolean} enableInfoWindow
     */
    addMarker(options, enableInfoWindow = false) {
        if ((options === null || options === void 0 ? void 0 : options.latitude) && typeof (options === null || options === void 0 ? void 0 : options.longitude)) {
            this.markerOptions = Object.assign(Object.assign(Object.assign({}, defaultMarkerOptions), options), { map: this.map, position: new google.maps.LatLng(options.latitude, options.longitude) });
            const marker = new google.maps.Marker(this.markerOptions);
            this.markers.push(marker);
            if (enableInfoWindow) {
                const infoWindow = this.createInfoWindow(options);
                if (infoWindow)
                    google.maps.event.addListener(marker, 'click', this.openInfoWindow(infoWindow, marker));
            }
            if (this.config.enableBounds) {
                this.bounds.extend(marker.getPosition());
                this.map.fitBounds(this.bounds);
            }
        }
    }
    /**
     * Delete Marker
     */
    deleteMarker(marker) {
        marker.setMap(null);
    }
    /**
     * Clear all Markers
     */
    clearMarkers() {
        this.markers.forEach(marker => this.deleteMarker(marker));
        this.markers = [];
    }
    // InfoWindow ############################################
    /**
     * Create InfoWindow
     * @param {Object} data
     * @returns {InfoWindow}
     */
    createInfoWindow(data) {
        if (!data)
            return null;
        const infoWindow = new google.maps.InfoWindow({ content: data.content });
        google.maps.event.addListener(infoWindow, 'closeclick', this.closeInfoWindow(infoWindow));
        return infoWindow;
    }
    /**
     * Open InfoWindow
     * @param {InfoWindow} infoWindow
     * @param {Marker} marker
     */
    openInfoWindow(infoWindow, marker) {
        return () => {
            // Close the last selected marker before opening this one.
            if (this.currentInfoWindow) {
                this.currentInfoWindow.close();
            }
            infoWindow.open(this.map, marker);
            this.currentInfoWindow = infoWindow;
        };
    }
    /**
     * Close InfoWindow
     * @param {InfoWindow} infoWindow
     */
    closeInfoWindow(infoWindow) {
        return () => {
            infoWindow.close();
        };
    }
    // Bounds ######################################################
    boundsMarkers() {
        if (!this.bounds)
            this.bounds = new google.maps.LatLngBounds();
        if (this.markers.length > 0) {
            this.markers.forEach(marker => this.bounds.extend(marker.getPosition()));
            this.map.fitBounds(this.bounds);
        }
    }
    // Direction ####################################################
    /**
     * string|google.maps.LatLng|google.maps.Place|google.maps.LatLngLiteral|Position
     * @param {String} start
     * @param {String} end
     * @param {String} travelMode   // DRIVING | BICYCLING | TRANSIT | WALKING | TWO_WHEELER
     */
    traceDirection(start, end, travelMode = google.maps.TravelMode.DRIVING) {
        if (this.directionsService == null) {
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer();
            this.directionsRenderer.setMap(this.map);
        }
        return new Promise((resolve, reject) => {
            try {
                const origin = start.latitude && start.longitude ? this.point(start.latitude, start.longitude) : start;
                const destination = end.longitude && end.longitude ? this.point(end.latitude, end.longitude) : end;
                const request = {
                    origin,
                    destination,
                    travelMode: google.maps.TravelMode[travelMode],
                };
                this.directionsService.route(request, (result, status) => {
                    if (status == 'OK') {
                        this.directionsRenderer.setDirections(result);
                        resolve(result);
                    }
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    // GeoLocalisation #############################################################
    /**
     * Load current position
     */
    getCurrentPosition({ enableHighAccuracy = true, timeout = 5000, maximumAge = 0 } = {}) {
        const options = {
            enableHighAccuracy,
            timeout,
            maximumAge,
        };
        return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
    }
}
