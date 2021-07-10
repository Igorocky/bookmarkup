'use strict';

const BookSelector = ({openView,setPageTitle}) => {
    const [availableBooks, setAvailableBooks] = useState(null)

    useEffect(() => {
        setPageTitle('Book Markup')
        be.listAvailableBooks().then(books => setAvailableBooks(books))
    }, [])

    function renderListOfAvailableBooks() {
        if (!availableBooks) {
            return "Loading..."
        } else {
            return RE.List({component:"nav"},
                availableBooks.map(book => RE.ListItem(
                    {
                        key:book.id,
                        button:true,
                        onClick: () => openView(VIEW_URLS.bookView({bookId:book.id}))
                    },
                    RE.ListItemText({}, book.title)
                ))
            )
        }
    }

    return RE.Container.col.top.center({style:{marginTop:'200px'}},{},
        renderListOfAvailableBooks()
    )
}