from django.db import models

class Funding(models.Model):
    university = models.CharField(max_length=200)
    department = models.CharField(max_length=201)
    professor = models.CharField(max_length=100)
    minimum_cgpa = models.FloatField()
    required_ielts_score = models.FloatField()
    funding_document_path = models.TextField()

    def __str__(self):
        return f"{self.university} -- {self.department}"