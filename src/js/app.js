import React from 'react'
import ReactDOM from 'react-dom'

// Helpers
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

// Get Dispatcher
const Dispatcher = require('flux').Dispatcher;
const AppDispatcher = new Dispatcher();
var MicroEvent = require('./microevent.js')


// Meet Actions
const ActionTypes = {
    EMAIL_AUTH:     'EMAIL_AUTH',
    EMAIL_RESEND:   'EMAIL_RESEND',
    EMAIL_ERROR:    'EMAIL_ERROR'
};

const Actions = {
    emailAuth(email) {
        AppDispatcher.dispatch({
            type: ActionTypes.EMAIL_AUTH,
            email: email
        });
    },
    emailResend() {
        AppDispatcher.dispatch({
            type: ActionTypes.EMAIL_RESEND
        });
    },
    emailError(email, error) {
        AppDispatcher.dispatch({
            type: ActionTypes.EMAIL_ERROR,
            email: email,
            error: error
        });
    },
}

// Introduce a simple store and add event emitting 
let EmailStore = {
    email: '',
    error: '',
    isSent: false
};

MicroEvent.mixin(EmailStore);

// Start the magic and register the store to listen to actions 
AppDispatcher.register(function(payload) {
    switch(payload.type) {
        case ActionTypes.EMAIL_AUTH:
            EmailStore.email = payload.email;

            fetch('http://api.cartexted.com/user/email/auth', {
                method: 'post',
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    email: EmailStore.email
                })
            })
                .then(function(response) {
                    response.json().then(function(data) {
                        if ('OK' == data.message) {
                            EmailStore.isSent = true;
                            EmailStore.trigger('change');
                        } else {
                            Actions.emailError(EmailStore.email, 'Something went wrong! Please try again later.');
                        }
                    });
                })
                .catch(function(error) {
                    alert(error);
                    EmailStore.trigger('change');
                });

            EmailStore.error = '';
            break;
        case ActionTypes.EMAIL_RESEND:
            EmailStore.isSent = false;
            EmailStore.trigger('change');
            break;
        case ActionTypes.EMAIL_ERROR:
            EmailStore.isSent = false;
            EmailStore.email = payload.email;
            EmailStore.error = payload.error;
            EmailStore.trigger('change');
            break;
    }
});

// Here comes the controller view
function ErrorMessage(props) {
    if ('' == props.text) return null;

    return (
        <div className="error">{props.text}</div>
)
}

class HomePageController extends React.Component {

    constructor(props) {
        super(props);

        // Init state
        this.state = {
            email: EmailStore.email,
            error: EmailStore.error,
            isSent: EmailStore.isSent
        };

        // Flag for runtime validation
        this.validateRuntime = false;

        // Bind this to the handlers
        this.storeUpdated = this.storeUpdated.bind(this);
        this.emailChanged = this.emailChanged.bind(this);
        this.emailSubmit = this.emailSubmit.bind(this);
        this.emailResend = this.emailResend.bind(this);
    }

    componentDidMount() {
        EmailStore.bind('change', this.storeUpdated);
    }

    componentWillUnmount() {
        EmailStore.unbind('change', this.storeUpdated);
    }

    storeUpdated() {
        this.setState({
            email: EmailStore.email,
            error: EmailStore.error,
            isSent: EmailStore.isSent
        });
    }

    emailChanged(event) {
        this.setState({email: event.target.value.toLowerCase(), error: ''});
    }

    emailSubmit(event) {
        event.preventDefault();

        if (validateEmail(this.state.email)) {
            this.validateRuntime = false;
            Actions.emailAuth(this.state.email);
        } else {
            this.validateRuntime = true;
            Actions.emailError(this.state.email, 'Invalid email! Please check and resubmit.');
        }
    }

    emailResend(event) {
        event.preventDefault();
        Actions.emailResend();
    }

    render() {
        let sendForm = null;
        let resendForm = null;
        let emailValidationClass = null;

        if (this.validateRuntime) {
            emailValidationClass = validateEmail(this.state.email) ? 'valid' : 'invalid';
        } else {
            emailValidationClass = '';
        }

        sendForm = (
            <div id="send-form">
            <form onSubmit={this.emailSubmit}>
    <input id="email" name="email" className={emailValidationClass} type="text" placeholder="Your Email" value={this.state.email} onChange={this.emailChanged} /><br />
        <ErrorMessage text={this.state.error} />
    <input id="email-submit" type="submit" value="Submit" />
            </form>
            </div>
    );

        resendForm = (
            <div id="resend-form">
            We sent you a verification link. Please check your inbox and follow the instruction.
        <form onSubmit={this.emailResend}>
    <input id="email-resend" type="submit" value="Resend" />
            </form>
            </div>
    );

        return (
        <div>
        {this.state.isSent ? (resendForm) : (sendForm)}
    </div>
    )
    }
}

// Render the component with a default value
window.addEventListener('DOMContentLoaded', function () {
    ReactDOM.render(<HomePageController />, document.getElementById("content"));
});