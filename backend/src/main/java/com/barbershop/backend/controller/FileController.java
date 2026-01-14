package com.barbershop.backend.controller;

import com.barbershop.backend.model.DBFile;
import com.barbershop.backend.repository.DBFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileController {

    @Autowired
    private DBFileRepository dbFileRepository;

    @PostMapping("/uploads")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            DBFile dbFile = new DBFile(file.getOriginalFilename(), file.getContentType(), file.getBytes());
            dbFile = dbFileRepository.save(dbFile);

            String fileDownloadUri = "/api/files/" + dbFile.getId();

            Map<String, String> response = new HashMap<>();
            response.put("url", fileDownloadUri);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Could not store file " + file.getOriginalFilename() + ". Please try again!");
        }
    }

    @GetMapping("/files/{id}")
    public ResponseEntity<byte[]> getFile(@PathVariable String id) {
        Optional<DBFile> dbFileOptional = dbFileRepository.findById(id);

        if (dbFileOptional.isPresent()) {
            DBFile dbFile = dbFileOptional.get();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + dbFile.getFileName() + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, dbFile.getFileType())
                    .body(dbFile.getData());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
