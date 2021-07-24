"use strict";

function RepeatGroups({
                          repeatGroups,
                          renderViewModeSelector,
                          saveRepeatGroups,
                          getSelectionById,
                          renderSingleSelection,
                          navigateToSelectionById,
                      }) {

    //repeat groups props
    const rg = {
        COLLECTIONS: 'COLLECTIONS',
        SELECTED_COLLECTION_IDX: 'SELECTED_COLLECTION_IDX',

        COLLECTION_NAME: 'COLLECTION_NAME',
        COLLECTION_PATH_ELEMS: 'COLLECTION_PATH_ELEMS',
        COLLECTION_SELECTED_CARD_IDX: 'COLLECTION_SELECTED_CARD_IDX',
        COLLECTION_COUNTS: 'COLLECTION_COUNTS',
        COLLECTION_CARDS: 'COLLECTION_CARDS',

        COLLECTION_CARD_PATH: 'COLLECTION_CARD_PATH',
        COLLECTION_CARD_SELECTION_IDS: 'COLLECTION_CARD_SELECTION_IDS',
    }

    const [openConfirmActionDialog, closeConfirmActionDialog, renderConfirmActionDialog] = useConfirmActionDialog()
    const [openedSelectionsIdxs, setOpenedSelectionsIdxs] = useState([])

    const currGroupIdx = repeatGroups[rg.SELECTED_COLLECTION_IDX]
    const currGroup = repeatGroups[rg.COLLECTIONS][currGroupIdx]
    const currGroupName = currGroup[rg.COLLECTION_NAME]
    const currPathElems = currGroup[rg.COLLECTION_PATH_ELEMS]
    const currCardIdx = currGroup[rg.COLLECTION_SELECTED_CARD_IDX]
    const currCard = currGroup[rg.COLLECTION_CARDS][currCardIdx]

    function selectAnotherGroup({newIdx}) {
        const newRepeatGroups = {
            ...repeatGroups,
            [rg.SELECTED_COLLECTION_IDX]: newIdx
        }
        saveRepeatGroups({newRepeatGroups})
    }

    function deleteCurrentGroup() {
        openConfirmActionDialog({
            confirmText: `Delete a repeat group '${currGroupName}'?`,
            onCancel: closeConfirmActionDialog,
            startActionBtnText: "Delete",
            startAction: ({updateInProgressText,onDone}) => {
                const newRepeatGroups = {
                    ...repeatGroups,
                    [rg.COLLECTIONS]: repeatGroups[rg.COLLECTIONS].removeAtIdx(currGroupIdx),
                    [rg.SELECTED_COLLECTION_IDX]: 0
                }
                saveRepeatGroups({
                    newRepeatGroups,
                    onDone: () => {
                        if (newRepeatGroups[rg.COLLECTIONS].length) {
                            closeConfirmActionDialog()
                        }
                    }
                })
            },
        })
    }

    function renderGroupSelector() {
        if (repeatGroups[rg.COLLECTIONS].length) {
            return RE.FormControl({},
                RE.Select(
                    {
                        label:'Group to repeat',
                        value: currGroupIdx,
                        onChange: event => selectAnotherGroup({newIdx:event.target.value})
                    },
                    repeatGroups[rg.COLLECTIONS].map((grp,idx) => RE.MenuItem({key: `${idx}-${grp[rg.COLLECTION_NAME]}`, value: idx},
                        getCountsStr({group:grp}) + ' ' + grp[rg.COLLECTION_NAME]
                    ))
                )
            )
        }
    }

    function renderDeleteCurrGroupButton() {
        return RE.IconButton({onClick:deleteCurrentGroup},
            RE.Icon({}, 'delete_forever')
        )
    }

    function getCountsStr({group}) {
        const counts = group[rg.COLLECTION_COUNTS]
        if (counts.length) {
            const min = counts.min()
            const cntToRepeat = counts.filter(c => c == min).length
            const cntRepeated = counts.length - cntToRepeat
            return `[${min}] ${cntRepeated}/${counts.length}`
        } else {
            return '[group is empty]'
        }
    }

    function renderCardPath() {
        if (currCard) {
            const path = currCard[rg.COLLECTION_CARD_PATH]
            return RE.Breadcrumbs({},path.map(id => RE.span({key:id}, currPathElems[id])))
        }
    }

    function showHideSelectionImage({selectionIdx}) {
        if (openedSelectionsIdxs.includes(selectionIdx)) {
            setOpenedSelectionsIdxs(prev => prev.filter(i => i != selectionIdx))
        } else {
            setOpenedSelectionsIdxs(prev => [...prev, selectionIdx])
        }
    }

    function renderSelection({selection, idx}) {
        return RE.Container.col.top.left({key:selection.id},{},
            RE.Container.row.left.center({style:{cursor: 'pointer', fontSize:'20px'}, className:'selection-title',},{},
                RE.span(
                    {
                        onClick: () => showHideSelectionImage({selectionIdx:idx})
                    },
                    selection.title
                ),
                RE.span(
                    {
                        style: {marginLeft: '10px'},
                        className: 'red-and-bold-on-hover',
                        onClick: e => {
                            e.stopPropagation();
                            navigateToSelectionById(selection.id)
                        }
                    },
                    NAVIGATE_TO_PAGE_SYMBOL
                ),
            ),
            openedSelectionsIdxs.includes(idx)?renderSingleSelection({selection,renderFrame:true}):null
        )
    }

    function renderCurrCardContent() {
        if (currCard) {
            return currCard[rg.COLLECTION_CARD_SELECTION_IDS].map((selId, idx) => renderSelection({selection:getSelectionById(selId), idx}))
        }
    }

    function selectNextCard() {
        if (currCard) {
            const newCounts = currGroup[rg.COLLECTION_COUNTS].inc(currCardIdx)
            const minCnt = newCounts.min()
            const possibleNewIdxs = newCounts.map((c,i) => ({c,i})).filter(({c,i}) => c == minCnt).map(({c,i}) => i)
            const newCurrGroup = {
                ...currGroup,
                [rg.COLLECTION_COUNTS]: newCounts,
                [rg.COLLECTION_SELECTED_CARD_IDX]: possibleNewIdxs[randomInt(0,possibleNewIdxs.length-1)],
            }
            const newRepeatGroups = {
                ...repeatGroups,
                [rg.COLLECTIONS]: repeatGroups[rg.COLLECTIONS].modifyAtIdx(currGroupIdx, () => newCurrGroup)
            }
            setOpenedSelectionsIdxs([])
            saveRepeatGroups({newRepeatGroups})
        }
    }

    function renderNextButton() {
        return RE.Button(
            {
                onClick: selectNextCard,
                variant: 'contained'
            },
            "Next >"
        )
    }

    function renderPageContent() {
        return RE.Container.col.top.left({},{style: {marginBottom:'10px'}},
            RE.Container.row.left.center({},{style:{marginRight:'5px'}},
                renderViewModeSelector(),
                renderGroupSelector(),
                renderDeleteCurrGroupButton(),
            ),
            renderCardPath(),
            renderCurrCardContent(),
            renderNextButton(),
            renderConfirmActionDialog(),
        )
    }

    return renderPageContent()
}
