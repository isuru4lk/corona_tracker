import app from "./app.js";
import { storageKey } from './../config.js'

// API URL 
const apiURL = 'http://hpb.health.gov.lk/api/get-current-statistical'

// Module object to export
const module = {}

/**
 * Register events of the extension
 */
const _registerEvents = () => {
	// Listen to toggle type of data event
	document.querySelector( '.switcher i' ).addEventListener( 'click', ({target}) => toggleData( target ) )

	// Listen to close icon click event
	document.querySelector( '.controllers i.fa-times-circle' ).addEventListener( 'click', closePopup )

	// Listen to background refresh change event
	document.querySelector( '#refresh' ).addEventListener( 'change', toggleRefresh )

	// Listen to background refresh interval change event
	document.querySelector( '#interval' ).addEventListener( 'change', changeInterval )

	// Listen to settings icon click event
	document.querySelector( '.controllers i.fa-bars' ).addEventListener( 'click', toggleSettings )
}

/**
 * Render data in exntention popup
 * @param {object} data Data from the API
 */
const _renderData = ( data ) => {
	let type = document.querySelector( '.switcher .fa-toggle-on' ).getAttribute( 'data-type' );

	document.querySelector( '#newCases .count' ).innerHTML = data[`${type}_new_cases`];
	document.querySelector( '#totalCases .count' ).innerHTML = data[`${type}_total_cases`];
	document.querySelector( '#recovered .count' ).innerHTML = data[`${type}_recovered`];
	document.querySelector( '#deaths .count' ).innerHTML = data[`${type}_deaths`];
}

/**
 * Display a spinner while loading the data from API
 */
const _loadingSpinner = () => {
	[ ...document.querySelectorAll( '.stats .count' ) ].map( el => el.innerHTML = '<i class="fa fa-spinner fa-spin">')
}

/**
 * Close the chrome extention
 */
const closePopup = () => window.close()

/**
 * Set alarm to run background refresh
 * @param {int} interval Alarm interval in minutes
 */
const _setAlarm = ( interval ) => {
	// Let's cancel the the existing alarm first
	 _removeAlarm()

	// Now we set the new alarm
	chrome.alarms.create( 'refresh' , { periodInMinutes: interval });
}

/**
 * Remove alarm to stop background refresh
 */
const _removeAlarm = () => {
	chrome.alarms.clear( 'refresh' );
}

/**
 * Toggle background refresh mode
 */
const toggleRefresh = async () => {
	let refresh     = document.querySelector( '#refresh' ).checked,
		intervalElm = document.querySelector( '#interval' ),
		interval    = intervalElm.value

	// Set refresh is enabled or not in local storage
	chrome.storage.sync.set({ refresh })

	// If refresh not enabled 
	if ( !refresh ) {
		// Disable interval dropdown
		intervalElm.disabled = true;

		// Remove current alarm 
		 _removeAlarm()
		return
	}

	// If refresh is enabled enable interval dropdown so user can change the interval
	intervalElm.disabled = false

	// Finally, let's set the alarm with the interval
	_setAlarm( Number(interval) )
}

/**
 * Change background refresh interval
 */
const changeInterval = () => {
	let interval = Number( document.querySelector( '#interval' ).value )

	// Set interval in local storage
	chrome.storage.sync.set({ interval })

	// Finally, let's set the alarm with the interval
	_setAlarm( interval )
}

const _setSettings = async () => {
	let refresh  = await app.getLocalStorageByKey( 'refresh' ),
		interval = await app.getLocalStorageByKey( 'interval' ),
		refreshElm = document.querySelector( '#refresh' ),
		intervalElm = document.querySelector( '#interval' )
		
	// If data is undefined in local storage, set default values
	refresh = typeof refresh === 'undefined' ? false : refresh
	interval = typeof interval === 'undefined' ? 5 : interval

	// Toggle background refresh checkbox
	refreshElm.checked = refresh

	if ( refresh ) {
		// If refresh is enabled, enable interval dropdown and select current interval
		intervalElm.disabled = false
		intervalElm.value = interval
	} else {
		// If refresh is disabled, disable interval dropdown
		intervalElm.disabled = true
	}
}

/**
 * Show/hidde settings section
 */
const toggleSettings = async () => {
	let settingsElm = document.querySelector( '.settings' ),
		height = settingsElm.classList.contains( 'show' ) ? 0 : settingsElm.scrollHeight
	
	// Let's wait until settings being set
	await _setSettings()
	
	// Slide up/down the section
	settingsElm.style.height = `${height}px`

	// Set class show, so we know that div is open
	settingsElm.classList.toggle( 'show' );
}

/**
 * Toggle data between Sri Lanka and Global
 * @param {*} element 
 */
const toggleData = async ( element ) => {
	// Show loading spinner while data being fetched
	_loadingSpinner();

	// Toggle data attribute type
	element.getAttribute( 'data-type' ) == 'local' ? element.setAttribute( 'data-type', 'global' ) : element.setAttribute( 'data-type', 'local' )

	// Toggle the side of the switch icon
	element.classList.toggle( 'fa-rotate-180' );

	// Load data from the local storage because its a toggle
	let data = await app.getLocalStorageByKey(storageKey);
	// If data is not available, then fetch from api
	if ( !data )
		data = await module.fetchData();

	// Store in local storage
	// Now we render the data
	_renderData( data )
}

/**
 * Store API data in the local storage
 * @param {object} data Statistics
 */
module.cleanAndSetLocalStorageData = ( data ) => {
	// Remove hospital data from the object
	delete data.hospital_data

	// Store in local storage
	app.setLocalStorageData( storageKey, data )
}

/**
 * Fetch data from API
 */
module.fetchAPIData = async () => {
	try {
		let response = await fetch( apiURL )
		let { data } = await response.json()

		return data
	} catch ( err ) {
		console.log(err)
		return false
	}
}

/**
 * Fetch data from API / local storage
 */
module.fetchData = async () => {
	// Load data from the API
	let data = await module.fetchAPIData()

	// If API data is available return it
	if ( data ) return data

	// If there is no API data use data we've stored in local storage
	data = await app.getLocalStorageByKey( 'covidStats' )
	
	// If local data is also not available, stop executing
	if ( typeof data === 'undefined' ) return false

	// Return local storage data
	return data
}

/**
 * Initialize extension when use clicks the icon
 */
module.init = async () => {
	// Show loading spinner while data being fetched
	_loadingSpinner()

	// Hide extension badge
	chrome.browserAction.setBadgeText({ text: '' })

	// Load data from the API / local storage
	let data = await module.fetchData()

	// If data is not available, register events and stop execution
	if ( !data ) {
		_registerEvents()
		return
	}

	// Render data to the popup
	_renderData( data )

	// Store in local storage
	module.cleanAndSetLocalStorageData( data )

	// Register events
	_registerEvents()
}

// Export the module
export default module;
