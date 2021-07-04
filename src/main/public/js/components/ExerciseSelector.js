'use strict';

const AVAILABLE_EXERCISES = [
    {name:"ImageSelector", component: ImageSelector},
]

const ExerciseSelector = ({}) => {
    // const [selectedExercise, setSelectedExercise] = useState(null)
    // const [selectedExercise, setSelectedExercise] = useState({component: ImageSelector})
    const [selectedExercise, setSelectedExercise] = useState({component: BookView})

    if (!selectedExercise) {
        return RE.List({component:"nav"},
            AVAILABLE_EXERCISES.map(ex => RE.ListItem({key:ex.name, button:true,
                    onClick: () => setSelectedExercise(ex)},
                RE.ListItemText({}, ex.name)
            ))
        )
    } else {
        return re(selectedExercise.component,{configName:"config1"})
    }
}