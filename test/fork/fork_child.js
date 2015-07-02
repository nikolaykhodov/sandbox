fs = require('fs');

process.on('message', function (m) {
	fs.writeFile('test_if_sandboxed_child', 'test', function(err) {
		if(err) throw(err);
		console.log('test_if_sandboxed_child has been successfully updated');
	})
});