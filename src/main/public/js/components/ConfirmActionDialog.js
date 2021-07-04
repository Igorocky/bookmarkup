"use strict";

const ConfirmActionDialog = ({confirmText, onCancel, startActionBtnText, startAction}) => {
    const [actionIsInProgress, setActionIsInProgress] = useState(false)
    const [actionIsDone, setActionIsDone] = useState(false)

    const [inProgressText, setInProgressText] = useState(confirmText)
    const [actionDoneText, setActionDoneText] = useState(null)
    const [actionDoneBtnText, setActionDoneBtnText] = useState(null)
    const [onActionDoneBtnClick, setOnActionDoneBtnClick] = useState(null)

    function doStartAction() {
        setActionIsInProgress(true)
        startAction({
            updateInProgressText: newInProgressText => setInProgressText(newInProgressText),
            onDone: ({actionDoneText, actionDoneBtnText, onActionDoneBtnClick}) => {
                setActionIsInProgress(false)
                setActionIsDone(true)
                setActionDoneText(actionDoneText)
                setActionDoneBtnText(actionDoneBtnText)
                setOnActionDoneBtnClick(() => onActionDoneBtnClick)
            }
        })
    }

    function drawContent() {
        if (actionIsInProgress) {
            return RE.Typography({}, inProgressText)
        } else if (!actionIsDone) {
            return RE.Typography({}, confirmText)
        } else {
            return RE.Typography({}, actionDoneText)
        }
    }

    function drawActionButtons() {
        if (!actionIsDone) {
            return RE.Fragment({},
                RE.Button({onClick: onCancel, disabled: actionIsInProgress}, "Cancel"),
                re(ButtonWithCircularProgress, {buttonText: startActionBtnText, startAction: doStartAction})
            )
        } else {
            return RE.Button({onClick: onActionDoneBtnClick, color:"primary", variant:"contained"},
                actionDoneBtnText
            )
        }
    }

    return RE.Dialog({open:true},
        RE.DialogContent({}, drawContent()),
        RE.DialogActions({}, drawActionButtons())
    )
}