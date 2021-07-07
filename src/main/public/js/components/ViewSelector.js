"use strict";

const BOOK_VIEW_BASE_PATH = '/bookView'

const VIEW_URLS = {
    bookSelector: '/',
    bookView: ({bookId}) => `${BOOK_VIEW_BASE_PATH}?bookId=${bookId}`,
}

const VIEWS = [
    {name:"BookSelector", component: BookSelector, path: VIEW_URLS.bookSelector},
    {name:"BookView", component: BookView, path: BOOK_VIEW_BASE_PATH},
]

function getViewAbsoluteUrl(relUrl) {
    const location = window.location
    return location.protocol + "//" + location.host + relUrl
}

const ViewSelector = ({}) => {
    const [currentViewUrl, setCurrentViewUrl] = useState(null)

    function getViewRoutes() {
        return VIEWS.map(view => re(Route, {
            key: view.path,
            path: view.path,
            exact: true,
            render: props => re(view.component, {
                ...props,
                ...(view.props?view.props:{}),
                openView: url => setCurrentViewUrl(url),
            })
        }))
    }

    function renderRedirectElem(url) {
        return url ? re(Redirect,{key: url, to: url}) : null
    }

    if (currentViewUrl) {
        return re(BrowserRouter, {},
            re(Switch, {}, getViewRoutes()),
            renderRedirectElem(currentViewUrl)
        )
    } else {
        const newViewUrl = window.location.pathname + window.location.search
        setCurrentViewUrl(newViewUrl)
        return renderRedirectElem(newViewUrl)
    }
}