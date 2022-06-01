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
    const [environmentName, setEnvironmentName] = useState(null)
    const [pageTitle, setPageTitle] = useState(null)

    useEffect(() => {
        be.getEnvironmentName().then(envName => setEnvironmentName(envName))
    }, [])

    useEffect(() => {
        updatePageTitle()
    }, [environmentName, pageTitle])

    function updatePageTitle() {
        document.title = `${environmentName == 'PROD' ? '' : '{' + environmentName + '} - '}${pageTitle}`
    }

    function renderView({view, props}) {
        return re(view.component, {
            ...props,
            ...(view.props?view.props:{}),
            openView: url => setCurrentViewUrl(url),
            setPageTitle: str => setPageTitle(str),
        })
    }

    function getViewRoutes() {
        return VIEWS.map(view => re(Route, {
            key: view.path,
            path: view.path,
            exact: true,
            render: props => renderView({view, props})
        }))
    }

    function renderRedirectElem(url) {
        return url ? re(Redirect,{key: url, to: url}) : null
    }

    if (currentViewUrl) {
        if (currentViewUrl.indexOf('bookId') > 0) {
            return renderView({view:VIEWS.find(v=>v.name==='BookView')})
        } else {
            return renderView({view:VIEWS.find(v=>v.name==='BookSelector')})
        }
        return re(BrowserRouter, {},
            re(Switch, {}, getViewRoutes()),
            renderRedirectElem(currentViewUrl)
        )
    } else {
        const newViewUrl = window.location.pathname + window.location.search
        setCurrentViewUrl(newViewUrl)
        console.log('newViewUrl', newViewUrl)
        return renderRedirectElem(newViewUrl)
    }
}