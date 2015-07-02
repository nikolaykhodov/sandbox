fs = require('fs');

fs.writeFile('test_if_sandboxed_spawn', 'test', function(err) {
	if(err) throw(err);
	console.log('test_if_sandboxed_spawn has been successfully updated');
});