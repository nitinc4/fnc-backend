import ApiResponse from "../../utils/api_response.js";
import path from "path";
import fs from 'fs';

function readFilesRecursively(directoryPath, baseDirectory) {
    // Read the contents of the directory
    const files = fs.readdirSync(directoryPath);

    // Array to store file paths
    let filePaths = [];

    // Iterate over the files in the directory
    files.forEach(function(file) {
        // Construct the full path of the file
        const filePath = path.join(directoryPath, file);

        // Check if the file is a directory
        if (fs.statSync(filePath).isDirectory()) {
            // If it's a directory, recursively read files in it
            const nestedFiles = readFilesRecursively(filePath, baseDirectory);
            // Add the nested files to the filePaths array
            filePaths = [...filePaths, ...nestedFiles];
        } else {
            // If it's a file, add its relative path to the filePaths array
            const relativePath = path.relative(baseDirectory, filePath);
            // Include 'public' in the relative path
            filePaths.push(path.join('public', relativePath));
        }
    });

    // Return the array of file paths
    return filePaths;
}


class FileController {

    static async get(req,res){
        try {
            //get all files under public folder with full path

            // Define the directory path where your files are located
            const directoryPath = './public'; // Adjust the path as needed

            const allFiles = readFilesRecursively(directoryPath, directoryPath);


            res.status(200).send(ApiResponse.success('Files retrieved successfully',allFiles));

        }catch (e){
            res.status(500).send(ApiResponse.error(e.message||'Internal Server Error'))
        }

    }

    static  async add(req,res){
        try {
            let {name,directory} = req.body;

            if(!name){
                name = req.file.originalname.split('.')[0];
            }

            if(!directory){
                directory = 'public';
            }

            //upload file to public folder
            let uploadedFile = req.file;

            // Example: Move the uploaded file to a specific directory
            const destinationPath = path.join(path.resolve(), '/'+directory+'/'); // Adjust the path as needed

            //get extension of uploaded file
            const ext = path.extname(uploadedFile.originalname);
            fs.renameSync(uploadedFile.path, path.join(destinationPath, name+ext));

            uploadedFile.filename = name+ext;
            uploadedFile.path =  directory+'/'+name+ext;

            return res.status(200).send(ApiResponse.success('File uploaded successfully', uploadedFile));

        }catch (e){
            res.status(500).send(ApiResponse.error(e.message||'Internal Server Error'))
        }
    }

    static async delete(req,res){
        try {
            //delete file from public folder by name
            const {pathname} = req.body

            if(!pathname){
                return res.status(400).send(ApiResponse.error('{ pathname } is required'));
            }

            const filePath = path.join(path.resolve(), '/'+pathname); // Adjust the path as needed

            if(!fs.existsSync(filePath)){
                return res.status(404).send(ApiResponse.error('File not found'));
            }
            fs.unlinkSync(filePath);

            return res.status(200).send(ApiResponse.success('File deleted successfully',true));

        }catch (e){
            res.status(500).send(ApiResponse.error(e.message||'Internal Server Error'))
        }

    }

}

export default FileController