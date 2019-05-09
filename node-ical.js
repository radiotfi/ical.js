var ical = require('./ical')
  , request = require('request')
  , fs = require('fs')
  , RRule = require('rrule').RRule

exports.fromURL = function(url, opts, cb){
  if (!cb)
    return;
  request(url, opts, function(err, r, data){
  	if (err)
  	{
  	  return cb(err, null);
  	}
  	else if (r.statusCode != 200)
  	{
       return cb(r.statusCode + ": " + r.statusMessage, null);
  	}

  	cb(undefined, ical.parseICS(data));
  })
}

exports.parseFile = function(filename){
  return ical.parseICS(fs.readFileSync(filename, 'utf8'))
}

ical.objectHandlers['RRULE'] = function(val, params, curr, stack, line){
  curr.rrule = line;
  return curr
}
var originalEnd = ical.objectHandlers['END'];
ical.objectHandlers['END'] = function (val, params, curr, stack) {
	// Recurrence rules are only valid for VEVENT, VTODO, and VJOURNAL.
	// More specifically, we need to filter the VCALENDAR type because we might end up with a defined rrule 
	// due to the subtypes.
	if ((val === "VEVENT") || (val === "VTODO") || (val === "VJOURNAL")) {
		if (curr.rrule) {
      var rule = curr.rrule.replace('RRULE:', '')
      var rruleOpts = RRule.parseString(rule)
      if (rule.indexOf('DTSTART') === -1) {
        rruleOpts.dtstart = new Date(Date.UTC(
          curr.start.getFullYear(),
          curr.start.getMonth(),
          curr.start.getDate(),
          curr.start.getHours(),
          curr.start.getMinutes()
        ))
      }
      curr.rrule = new RRule(rruleOpts)
		}
	}
  return originalEnd.call(this, val, params, curr, stack);
}
