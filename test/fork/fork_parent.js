var child_process = require('child_process');

function forkChild() {
	var child = child_process.fork('./fork_child');
	child.send('message');
}

function spawnChild() {
	child_process.spawn('node', ['./fork_spawn.js']);
}

spawnChild();
forkChild();