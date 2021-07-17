'use strict';

const TagSelector = ({allKnownTags,selectedTags,onTagRemoved,onTagSelected}) => {
    const [editedTag, setEditedTag] = useState('')

    return RE.Fragment({},
        RE.TextField(
            {
                variant: 'outlined', label: 'Tag',
                style: {width: '100px'},
                onChange: event => {
                    const editedTag = event.nativeEvent.target.value
                    setEditedTag(editedTag)
                },
                onKeyUp: event => {
                    if (event.nativeEvent.keyCode == 13) {
                        const newTag = editedTag.trim()
                        if (newTag.length) {
                            onTagSelected(newTag)
                            setEditedTag('')
                        }
                    } else if (event.nativeEvent.keyCode == 27) {
                        setEditedTag('')
                    }
                },
                value: editedTag
            }
        ),
        allKnownTags.map(tag => RE.Chip({
            key:tag,
            variant:'outlined',
            color:selectedTags.includes(tag)?'primary':undefined,
            size:'small',
            onClick: !selectedTags.includes(tag) ? () => onTagSelected(tag) : undefined,
            onDelete: selectedTags.includes(tag) ? () => onTagRemoved(tag) : undefined,
            label: tag,
            style: {marginRight:'5px',marginLeft:'10px', marginTop:'15px'}
        }))
    )
}