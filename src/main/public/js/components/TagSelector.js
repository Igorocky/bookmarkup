'use strict';

const TagSelector = ({allKnownTags,selectedTags,onTagRemoved,onTagSelected,renderTextField = true, tagsLabel}) => {
    const [editedTag, setEditedTag] = useState('')

    function renderTags() {
        return allKnownTags.map(tag => RE.Chip({
            key:tag,
            variant:'outlined',
            color:selectedTags.includes(tag)?'primary':undefined,
            size:'small',
            onClick: !selectedTags.includes(tag) ? () => onTagSelected(tag) : undefined,
            onDelete: selectedTags.includes(tag) ? () => onTagRemoved(tag) : undefined,
            label: tag,
            style: {marginRight:'5px',marginLeft:'10px', marginTop:hasValue(tagsLabel)?'0px':'15px'}
        }))
    }

    return RE.Paper({style:{padding:hasValue(tagsLabel)?'3px':'0px'}},
        renderTextField?RE.TextField(
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
        ):null,
        hasValue(tagsLabel)?tagsLabel:'',
        renderTags()
    )
}