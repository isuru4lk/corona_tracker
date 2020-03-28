import stats from "./module/stats.js"
import app from "./module/app.js"
import { covidStatsKey, bubbleCountKey } from './constants.js'

/**
 * Listen to alarm 'refresh' and notify user
 */
chrome.alarms.onAlarm.addListener(({ name }) => {
	if ( name == 'refresh') notify()
});

/**
 * Notify user by rich notificatio and updating extension bubble
 */
const notify = async () => {
	// Let's keep this console log, so we know alarm has been triggered
	console.log( 'refreshed' )

	// Fetch API data
	let data = await stats.fetchAPIData()

	// If API data is not available. stop execution
	if ( !data ) return

	let localData   = await app.getLocalStorageByKey( covidStatsKey ),
		bubbleCount = await app.getLocalStorageByKey( bubbleCountKey ),
		newCasesCount = data.local_total_cases - localData.local_total_cases

	// If undefined set default value 0
	bubbleCount = typeof bubbleCount === 'undefined' ? 0 : bubbleCount

	// If there are new local cases show notification and badge
	if ( newCasesCount && bubbleCount < newCasesCount ) {
		let now                = Date.now(),
			plural             = newCasesCount > 1 ? 's' : '',
			notifiactionObject = {
				type: 'basic',
				iconUrl: 'icon.png',
				title: `New COVID-19 case${plural}`,
				message: `${newCasesCount} new COVID-19 patient${plural} found in Sri Lanka`
			}

		// Show rich notification
		chrome.notifications.create( `newPatients${now}`, notifiactionObject )

		// Update badge color text and show
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
		chrome.browserAction.setBadgeText({ text: `${newCasesCount}` })

		// Set number of current new cases as bubbleCount in local storage
		app.setLocalStorageData( bubbleCountKey, newCasesCount )
	}
}
