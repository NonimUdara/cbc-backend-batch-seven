import Student from "../models/student.js";

export async function getStudents (req, res)  {

    try{
        const students = await Student.find();
        res.json(students);
    }catch(error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
};

// export function getStudents (req, res)  {
    
//         Student.find().then(
//             (students) => {
//                 console.log(students);
//                 res.json(students);
//             }
//         ).catch(
//             (error) => {
//                 console.error("Error fetching students:", error);
//                 res.status(500).json({ error: "Failed to fetch students" });
//             }
//         );
// };


export function createStudent(req, res)  {
        
        if (req.user == null) {
            res.status(401).json({
                message: "Please login and try again"
            })
            return
        }

        if(req.user.role != "admin") {
            res.status(403).json({
                message: "You are not authorized to create a student"
            })
            return
        }

        const student = new Student(
        {
            name: req.body.name,
            age: req.body.age,
            city: req.body.city
        }
    );

    student.save().then(
        () => {
            console.log("Student saved successfully");
            res.json({ message: "Student saved successfully" });
        }
    ).catch(
        () => {
            console.error("Error saving student:", error);
            res.json({ error: "Failed to save student" });
        }
    )

    };