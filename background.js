import stats from "./module/stats.js"
import app from "./module/app.js"
import { covidStatsKey, bubbleCountKey } from './module/constants.js'

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
	console.log( 'Refreshed!' )

	// Fetch API data
	let data = await stats.fetchAPIData()

	// If API data is not available. stop execution
	if ( !data ) return

	let localData         = await app.getLocalStorageByKey( covidStatsKey ),
		bubbleCount       = await app.getLocalStorageByKey( bubbleCountKey ),
		newCasesCount     = data.local_total_cases - localData.local_total_cases,
		newRecoveredCount = data.local_recovered - localData.local_recovered,
		newDeathCount     = data.local_deaths - localData.local_deaths,
		notifyNewcases    = false,
		notifyRecovered   = false
		
		// If bubbleCount is undefined set newCasesCount as bubbleCount
		bubbleCount = typeof bubbleCount === 'undefined' ? newCasesCount : bubbleCount + newCasesCount
		
	// If there are any new local cases show notification and badge
	if ( newCasesCount ) {
		let plural = newCasesCount > 1 ? 's' : '',
			data   = {
				type: 'basic',
				iconUrl: 'icons/icon.png',
				title: `New COVID-19 case${plural}`,
				message: `${newCasesCount} new COVID-19 patient${plural} found in Sri Lanka`
			}
		
		// Show rich notification
		notifyNewcases = await app.showNotification( data )

		// Update badge color text and show
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
		chrome.browserAction.setBadgeText({ text: `${bubbleCount}` })

		// Update bubbleCount in local storage
		await app.setLocalStorageData( bubbleCountKey, bubbleCount )
	}

	// If there are any new recovered patients
	if ( newRecoveredCount ) {
		let plural = newRecoveredCount > 1 ? 's' : '',
			data   = {
				type: 'basic',
				iconUrl: 'icons/icon.png',
				title: `${newRecoveredCount} Paitent${plural} got recovered`,
				message: `Another ${newRecoveredCount} patient${plural} got recovered in Sri Lanka`
			}
			
		// If new case notification is sent, wait until it disappears
		if ( notifyNewcases ) await app.sleep( 5000 )

		// Show rich notification
		notifyRecovered = await app.showNotification( data )
	}

	// If there are any new deaths
	// Wish we don't need to show any notifications like this!
	if ( newDeathCount ) {
		let plural = newDeathCount > 1 ? 's' : '',
			data   = {
				type: 'basic',
				iconUrl: 'icons/icon.png',
				title: `${newDeathCount} New death${plural}`,
				message: `Another ${newDeathCount} patient${plural} died in Sri Lanka`
			}
			
		// If new recovered notification is sent, wait until it disappears
		if ( notifyRecovered ) await app.sleep( 5000 )

		// Show rich notification
		await app.showNotification( data )
	}

	// Update local storage data
	stats.cleanAndSetLocalStorageData( data )
}
