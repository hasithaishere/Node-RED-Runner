import http from 'http';
import express from 'express';
import RED from 'node-red';

import auth from './middlewares/auth'

class NodeREDRunner {
    constructor() {
        /**
         *  Set up server IP address and port # using env variables/defaults.
         */
        this.ip = process.env.NR_IP || '127.0.0.1';
        this.port = process.env.NR_PORT || 8100;
        this.redSettings = {
            httpAdminRoot:'/',
            httpNodeRoot: '/api',
            userDir: process.env.DATA_DIR || './'
        };

        this.routes = {};

        // Initialization
        this.setupTerminationHandlers();
        this.initializeServer();
    }

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */                    

     /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    terminator(sig) {
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating app ...',
                       Date(Date.now()), sig);
            RED.stop();
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };

    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    setupTerminationHandlers() {
        //  Process on exit and signals.
        process.on('exit', () => { this.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach((element) => {
            process.on(element, () => { this.terminator(element); });
        });
    };

    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    createRoutes() {
        this.routes['/asciimo'] = (req, res) => {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };
    };

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    initializeServer() {
        this.createRoutes();

        // Create an Express app
        this.app = express();

        // Create a server
        this.server = http.createServer(this.app);

        //setup basic authentication
        this.app.use(auth);

        // Initialize the runtime with a server and settings
        RED.init(this.server, this.redSettings);
        console.log('%s is the userDir for RED', this.redSettings.userDir);

        // Serve the editor UI from /red
        this.app.use(this.redSettings.httpAdminRoot,RED.httpAdmin);

        // Serve the http nodes UI from /api
        this.app.use(this.redSettings.httpNodeRoot,RED.httpNode);

        // Add a simple route for static content served from 'public'
        //self.app.use("/",express.static("public"));

        //  Add handlers for the app (from the routes).
        for (let r in this.routes) {
            this.app.get(r, this.routes[r]);
        }
    };

    /**
     *  Start the server (starts up the sample application).
     */
    start() {
        //  Start the app on the specific interface (and port).
        this.server.listen(this.port, () => {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), this.ip, this.port);
        });

        // Start the runtime
        RED.start();
    };
}

/**
 *  main():  Main code.
 */
const runner = new NodeREDRunner();
runner.start();